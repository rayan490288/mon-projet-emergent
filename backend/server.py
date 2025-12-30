from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import base64
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.units import cm
from fastapi.responses import StreamingResponse
import aiofiles

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'brevet_ai')]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'brevet-ai-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# OpenAI Settings
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

app = FastAPI(title="Brevet AI - Application de révision intelligente")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    school_type: Optional[str] = "college_public"
    academy: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfile(BaseModel):
    id: str
    email: str
    name: str
    school_type: Optional[str] = None
    academy: Optional[str] = None
    created_at: str
    preferences: Dict[str, Any] = {}
    memory: Dict[str, Any] = {}

class UserPreferencesUpdate(BaseModel):
    difficulty_level: Optional[str] = None
    weak_subjects: Optional[List[str]] = None
    objectives: Optional[List[str]] = None
    study_preferences: Optional[Dict[str, Any]] = None

class UserMemoryUpdate(BaseModel):
    key: str
    value: Any

class RevisionRequest(BaseModel):
    subject: str
    chapter: str
    request_type: str = "summary"  # summary, definitions, methods, errors, exercises, key_points

class TrainingRequest(BaseModel):
    subject: str
    chapter: Optional[str] = None
    exercise_type: str = "qcm"  # qcm, open_questions, true_false, brevet_type, evaluation
    difficulty: str = "medium"  # easy, medium, hard
    count: int = 5

class LiteraryWorkRequest(BaseModel):
    title: str
    author: str
    genre: Optional[str] = None
    year: Optional[str] = None
    request_type: str = "summary"  # summary, characters, themes, questions

class HelpRequest(BaseModel):
    question: str
    subject: Optional[str] = None
    detail_level: str = "simple"  # simple, detailed
    guided_mode: bool = False  # No direct answer mode

class FileAnalysisRequest(BaseModel):
    content: str  # base64 encoded
    file_type: str  # pdf, image, text
    analysis_type: str = "summary"  # summary, fiche, qcm, evaluation

class DictationRequest(BaseModel):
    dictation_type: str = "classic"  # classic, fill_blanks, prepared, assessment
    length: str = "medium"  # short, medium, long
    difficulty: str = "medium"
    custom_text: Optional[str] = None

class DictationCheckRequest(BaseModel):
    original_text: str
    student_text: str

class BrevetMethodRequest(BaseModel):
    subject: str
    topic: str = "general"  # general, writing, justification, time_management

class ProgressEntry(BaseModel):
    subject: str
    activity_type: str
    score: Optional[float] = None
    details: Dict[str, Any] = {}

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Utilisateur non trouvé")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expiré")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalide")

# ==================== AI HELPERS ====================

SUBJECTS = {
    "francais": {"name": "Français", "icon": "BookOpen"},
    "mathematiques": {"name": "Mathématiques", "icon": "Calculator"},
    "histoire_geo": {"name": "Histoire-Géographie", "icon": "Globe"},
    "emc": {"name": "EMC", "icon": "Scale"},
    "svt": {"name": "SVT", "icon": "Leaf"},
    "physique_chimie": {"name": "Physique-Chimie", "icon": "FlaskConical"},
    "technologie": {"name": "Technologie", "icon": "Cpu"},
    "langues": {"name": "Langues vivantes", "icon": "Languages"}
}

async def call_ai(system_prompt: str, user_message: str, session_id: str = None) -> str:
    """Call OpenAI GPT-5.2 via emergentintegrations"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        if not EMERGENT_LLM_KEY:
            raise HTTPException(status_code=500, detail="Clé API non configurée")
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id or str(uuid.uuid4()),
            system_message=system_prompt
        )
        chat.with_model("openai", "gpt-5.2")
        
        user_msg = UserMessage(text=user_message)
        response = await chat.send_message(user_msg)
        return response
    except Exception as e:
        logger.error(f"AI Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur IA: {str(e)}")

async def call_ai_with_image(system_prompt: str, user_message: str, image_base64: str, session_id: str = None) -> str:
    """Call OpenAI GPT-5.2 with image via emergentintegrations"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
        
        if not EMERGENT_LLM_KEY:
            raise HTTPException(status_code=500, detail="Clé API non configurée")
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id or str(uuid.uuid4()),
            system_message=system_prompt
        )
        chat.with_model("openai", "gpt-5.2")
        
        image_content = ImageContent(image_base64=image_base64)
        user_msg = UserMessage(text=user_message, file_contents=[image_content])
        response = await chat.send_message(user_msg)
        return response
    except Exception as e:
        logger.error(f"AI Vision Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur IA Vision: {str(e)}")

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register")
async def register(user: UserCreate):
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user.email,
        "password": hash_password(user.password),
        "name": user.name,
        "school_type": user.school_type,
        "academy": user.academy,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "preferences": {},
        "memory": {}
    }
    await db.users.insert_one(user_doc)
    token = create_token(user_id)
    
    return {"token": token, "user": {"id": user_id, "email": user.email, "name": user.name}}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    token = create_token(user["id"])
    return {
        "token": token, 
        "user": {
            "id": user["id"], 
            "email": user["email"], 
            "name": user["name"]
        }
    }

@api_router.get("/auth/me", response_model=UserProfile)
async def get_me(user: dict = Depends(get_current_user)):
    return UserProfile(**user)

@api_router.put("/auth/preferences")
async def update_preferences(prefs: UserPreferencesUpdate, user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in prefs.model_dump().items() if v is not None}
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {f"preferences.{k}": v for k, v in update_data.items()}}
    )
    return {"success": True, "message": "Préférences mises à jour"}

@api_router.put("/auth/memory")
async def update_memory(memory: UserMemoryUpdate, user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {f"memory.{memory.key}": memory.value}}
    )
    return {"success": True, "message": "Mémoire mise à jour"}

@api_router.delete("/auth/memory/{key}")
async def delete_memory(key: str, user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"id": user["id"]},
        {"$unset": {f"memory.{key}": ""}}
    )
    return {"success": True, "message": "Information supprimée"}

# ==================== SUBJECTS ENDPOINTS ====================

@api_router.get("/subjects")
async def get_subjects():
    return {"subjects": SUBJECTS}

# ==================== REVISION AI ENDPOINTS ====================

@api_router.post("/ai/revision")
async def revision_ai(request: RevisionRequest, user: dict = Depends(get_current_user)):
    subject_name = SUBJECTS.get(request.subject, {}).get("name", request.subject)
    
    prompts = {
        "summary": f"Fais un résumé clair et structuré du chapitre '{request.chapter}' en {subject_name} pour un élève de 3ème. Utilise des titres, sous-titres et listes à puces.",
        "definitions": f"Liste toutes les définitions essentielles du chapitre '{request.chapter}' en {subject_name} pour le brevet. Format: terme - définition claire.",
        "methods": f"Explique les méthodes et techniques importantes du chapitre '{request.chapter}' en {subject_name}. Donne des étapes claires.",
        "errors": f"Liste les erreurs fréquentes des élèves sur le chapitre '{request.chapter}' en {subject_name} et comment les éviter.",
        "exercises": f"Crée 3 exercices corrigés de difficulté progressive sur le chapitre '{request.chapter}' en {subject_name}.",
        "key_points": f"Quels sont les points clés à retenir absolument pour le brevet sur le chapitre '{request.chapter}' en {subject_name}?"
    }
    
    system_prompt = """Tu es un professeur expert du programme de 3ème en France. 
Tu fournis des réponses pédagogiques, structurées et adaptées au niveau brevet.
Tu ne inventes jamais d'informations. Si tu n'es pas sûr, dis-le clairement.
Réponds toujours en français."""
    
    user_prompt = prompts.get(request.request_type, prompts["summary"])
    
    response = await call_ai(system_prompt, user_prompt, f"revision_{user['id']}_{request.subject}")
    
    # Log progress
    await db.progress.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "subject": request.subject,
        "activity_type": "revision",
        "details": {"chapter": request.chapter, "request_type": request.request_type},
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {"response": response, "subject": subject_name, "chapter": request.chapter}

# ==================== TRAINING AI ENDPOINTS ====================

@api_router.post("/ai/training")
async def training_ai(request: TrainingRequest, user: dict = Depends(get_current_user)):
    subject_name = SUBJECTS.get(request.subject, {}).get("name", request.subject)
    chapter_info = f" sur le chapitre '{request.chapter}'" if request.chapter else ""
    
    difficulty_desc = {"easy": "facile", "medium": "intermédiaire", "hard": "difficile (niveau brevet)"}
    
    prompts = {
        "qcm": f"""Génère {request.count} QCM de niveau {difficulty_desc[request.difficulty]} en {subject_name}{chapter_info}.
Format JSON:
[{{"question": "...", "options": ["A", "B", "C", "D"], "correct": 0, "explanation": "..."}}]""",
        "open_questions": f"""Génère {request.count} questions ouvertes de niveau {difficulty_desc[request.difficulty]} en {subject_name}{chapter_info}.
Format JSON:
[{{"question": "...", "expected_answer": "...", "points": 4, "criteria": ["..."]}}]""",
        "true_false": f"""Génère {request.count} affirmations vrai/faux de niveau {difficulty_desc[request.difficulty]} en {subject_name}{chapter_info}.
Format JSON:
[{{"statement": "...", "is_true": true/false, "explanation": "..."}}]""",
        "brevet_type": f"""Génère un exercice type brevet en {subject_name}{chapter_info}.
Inclus: énoncé complet, barème détaillé, correction complète.""",
        "evaluation": f"""Génère une évaluation notée sur 20 en {subject_name}{chapter_info}.
Inclus plusieurs types d'exercices, un barème clair, et une correction détaillée."""
    }
    
    system_prompt = """Tu es un professeur expert créant des exercices pour le brevet français.
Tous les exercices doivent être conformes au programme officiel de 3ème.
Pour les formats JSON, retourne UNIQUEMENT le JSON valide sans texte autour.
Pour les autres formats, structure clairement avec des titres."""
    
    response = await call_ai(system_prompt, prompts[request.exercise_type], f"training_{user['id']}_{request.subject}")
    
    return {
        "response": response, 
        "subject": subject_name, 
        "exercise_type": request.exercise_type,
        "difficulty": request.difficulty
    }

# ==================== LITERARY WORKS AI ENDPOINTS ====================

@api_router.post("/ai/literary")
async def literary_ai(request: LiteraryWorkRequest, user: dict = Depends(get_current_user)):
    work_info = f"'{request.title}' de {request.author}"
    if request.genre:
        work_info += f" ({request.genre})"
    if request.year:
        work_info += f", {request.year}"
    
    prompts = {
        "summary": f"Fais un résumé complet et structuré de l'œuvre {work_info}. Inclus l'intrigue principale, les moments clés et la conclusion.",
        "characters": f"Analyse les personnages principaux de {work_info}. Pour chaque personnage: nom, rôle, caractéristiques, évolution.",
        "themes": f"Analyse les thèmes principaux de {work_info}. Explique chaque thème avec des exemples du texte.",
        "questions": f"Génère des questions de type brevet sur {work_info}: QCM, questions de compréhension, sujet de rédaction."
    }
    
    system_prompt = """Tu es un professeur de français expert en littérature.
Tu analyses UNIQUEMENT les œuvres existantes. Si tu ne connais pas une œuvre ou si tu as des doutes, dis-le clairement.
N'invente JAMAIS de contenu. Base-toi uniquement sur tes connaissances vérifiées.
Réponds de manière structurée et adaptée au niveau 3ème."""
    
    response = await call_ai(system_prompt, prompts[request.request_type], f"literary_{user['id']}")
    
    return {
        "response": response,
        "work": {"title": request.title, "author": request.author},
        "request_type": request.request_type
    }

# ==================== HELP AI ENDPOINTS ====================

@api_router.post("/ai/help")
async def help_ai(request: HelpRequest, user: dict = Depends(get_current_user)):
    subject_context = f" en {SUBJECTS.get(request.subject, {}).get('name', request.subject)}" if request.subject else ""
    
    if request.guided_mode:
        system_prompt = """Tu es un tuteur bienveillant qui aide les élèves de 3ème.
MODE GUIDÉ ACTIF: Tu ne donnes PAS la réponse directement.
Au lieu de cela, tu:
1. Poses des questions pour comprendre où l'élève bloque
2. Donnes des indices progressifs
3. Rappelles les méthodes utiles
4. Encourages l'élève à trouver lui-même
L'objectif est d'apprendre à réfléchir, pas de copier une réponse."""
    else:
        detail_prompts = {
            "simple": "Explique de manière simple et concise, avec des mots faciles à comprendre.",
            "detailed": "Explique en détail avec des exemples, des étapes claires et des illustrations si pertinent."
        }
        system_prompt = f"""Tu es un assistant pédagogique pour élèves de 3ème.
{detail_prompts[request.detail_level]}
Si tu n'es pas sûr d'une information, dis-le clairement.
Adapte ton langage au niveau collège."""
    
    user_prompt = f"Question{subject_context}: {request.question}"
    
    response = await call_ai(system_prompt, user_prompt, f"help_{user['id']}")
    
    return {"response": response, "guided_mode": request.guided_mode}

# ==================== FILE ANALYSIS AI ENDPOINTS ====================

@api_router.post("/ai/analyze-file")
async def analyze_file(request: FileAnalysisRequest, user: dict = Depends(get_current_user)):
    analysis_prompts = {
        "summary": "Résume le contenu de ce document de manière claire et structurée.",
        "fiche": "Transforme ce contenu en fiche de révision avec: points clés, définitions, méthodes.",
        "qcm": "Génère 5 QCM basés sur ce contenu. Format JSON.",
        "evaluation": "Crée une évaluation complète basée sur ce contenu avec barème."
    }
    
    system_prompt = f"""Tu es un assistant pédagogique analysant des documents scolaires de niveau 3ème.
{analysis_prompts[request.analysis_type]}
Si des parties sont illisibles ou manquantes, signale-le clairement.
Structure ta réponse de manière claire."""
    
    if request.file_type == "image":
        response = await call_ai_with_image(
            system_prompt,
            "Analyse cette image de cours/exercice et réponds selon les instructions.",
            request.content,
            f"file_{user['id']}"
        )
    else:
        # For text/pdf, decode and send as text
        try:
            decoded_content = base64.b64decode(request.content).decode('utf-8')
        except:
            decoded_content = request.content
        
        response = await call_ai(
            system_prompt,
            f"Contenu du document:\n\n{decoded_content}",
            f"file_{user['id']}"
        )
    
    return {"response": response, "analysis_type": request.analysis_type}

# ==================== DICTATION AI ENDPOINTS ====================

@api_router.post("/ai/dictation/generate")
async def generate_dictation(request: DictationRequest, user: dict = Depends(get_current_user)):
    length_words = {"short": "50-80", "medium": "100-150", "long": "200-250"}
    
    if request.custom_text:
        text = request.custom_text
        prompt = f"""Prépare cette dictée pour un élève de 3ème:
Texte: {text}
Type de dictée: {request.dictation_type}
Crée les éléments préparatoires adaptés."""
    else:
        type_instructions = {
            "classic": "Une dictée classique à dicter phrase par phrase.",
            "fill_blanks": "Une dictée à trous avec les mots difficiles à compléter.",
            "prepared": "Une dictée préparée avec liste des difficultés à étudier avant.",
            "assessment": "Une dictée bilan couvrant plusieurs règles d'orthographe."
        }
        
        prompt = f"""Génère une dictée de niveau 3ème/brevet:
- Longueur: {length_words[request.length]} mots
- Difficulté: {request.difficulty}
- Type: {type_instructions[request.dictation_type]}

Fournis:
1. Le texte de la dictée
2. Les points de vigilance orthographique
3. Les règles grammaticales sollicitées"""
    
    system_prompt = """Tu es un professeur de français créant des dictées pour le brevet.
Les textes doivent être de qualité littéraire, adaptés au niveau 3ème.
Respecte les règles orthographiques actuelles."""
    
    response = await call_ai(system_prompt, prompt, f"dictation_{user['id']}")
    
    return {"response": response, "dictation_type": request.dictation_type}

@api_router.post("/ai/dictation/check")
async def check_dictation(request: DictationCheckRequest, user: dict = Depends(get_current_user)):
    system_prompt = """Tu es un correcteur de dictées expert.
Compare le texte de l'élève au texte original.
Pour chaque faute:
1. Identifie le mot erroné et la correction
2. Catégorise (orthographe, grammaire, conjugaison, accord)
3. Explique la règle applicable
Fournis aussi des statistiques et des fiches de règles pour les fautes récurrentes."""
    
    prompt = f"""TEXTE ORIGINAL:
{request.original_text}

TEXTE DE L'ÉLÈVE:
{request.student_text}

Corrige en détail et génère les statistiques d'erreurs."""
    
    response = await call_ai(system_prompt, prompt, f"dictation_check_{user['id']}")
    
    # Log progress
    await db.progress.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "subject": "francais",
        "activity_type": "dictation",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {"response": response}

# ==================== BREVET METHOD AI ENDPOINTS ====================

@api_router.post("/ai/brevet-method")
async def brevet_method_ai(request: BrevetMethodRequest, user: dict = Depends(get_current_user)):
    subject_name = SUBJECTS.get(request.subject, {}).get("name", request.subject)
    
    topic_prompts = {
        "general": f"Explique les consignes officielles et attendus du brevet en {subject_name}. Comment réussir l'épreuve?",
        "writing": f"Comment rédiger une réponse structurée en {subject_name} pour le brevet? Donne la méthode et des exemples.",
        "justification": f"Comment justifier ses réponses en {subject_name} au brevet? Méthode et exemples concrets.",
        "time_management": f"Comment gérer son temps pendant l'épreuve de {subject_name} au brevet? Conseils pratiques."
    }
    
    system_prompt = """Tu es un expert du brevet des collèges français.
Explique les méthodes et attendus officiels.
Donne des conseils pratiques et concrets.
Utilise des exemples réels d'épreuves passées si pertinent."""
    
    response = await call_ai(system_prompt, topic_prompts[request.topic], f"brevet_{user['id']}")
    
    return {"response": response, "subject": subject_name, "topic": request.topic}

# ==================== PROGRESS ENDPOINTS ====================

@api_router.post("/progress")
async def log_progress(entry: ProgressEntry, user: dict = Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "subject": entry.subject,
        "activity_type": entry.activity_type,
        "score": entry.score,
        "details": entry.details,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.progress.insert_one(doc)
    return {"success": True, "id": doc["id"]}

@api_router.get("/progress")
async def get_progress(user: dict = Depends(get_current_user)):
    progress = await db.progress.find(
        {"user_id": user["id"]}, 
        {"_id": 0}
    ).sort("timestamp", -1).to_list(100)
    return {"progress": progress}

@api_router.get("/progress/stats")
async def get_progress_stats(user: dict = Depends(get_current_user)):
    pipeline = [
        {"$match": {"user_id": user["id"]}},
        {"$group": {
            "_id": "$subject",
            "total_activities": {"$sum": 1},
            "avg_score": {"$avg": "$score"},
            "last_activity": {"$max": "$timestamp"}
        }}
    ]
    stats = await db.progress.aggregate(pipeline).to_list(20)
    
    # Detect recurring errors
    errors_pipeline = [
        {"$match": {"user_id": user["id"], "details.errors": {"$exists": True}}},
        {"$unwind": "$details.errors"},
        {"$group": {"_id": "$details.errors", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    recurring_errors = await db.progress.aggregate(errors_pipeline).to_list(10)
    
    return {
        "by_subject": {s["_id"]: s for s in stats},
        "recurring_errors": recurring_errors,
        "total_activities": sum(s["total_activities"] for s in stats)
    }

# ==================== PDF GENERATION ENDPOINTS ====================

@api_router.post("/pdf/generate")
async def generate_pdf(
    title: str = Form(...),
    content: str = Form(...),
    pdf_type: str = Form("fiche"),
    user: dict = Depends(get_current_user)
):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=30,
        textColor='#4F46E5'
    )
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontSize=11,
        leading=16,
        spaceAfter=12
    )
    
    story = []
    story.append(Paragraph(f"Brevet AI - {title}", title_style))
    story.append(Spacer(1, 20))
    
    # Split content by lines and add paragraphs
    for line in content.split('\n'):
        if line.strip():
            story.append(Paragraph(line, body_style))
    
    story.append(Spacer(1, 30))
    story.append(Paragraph(f"Généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')}", styles['Italic']))
    
    doc.build(story)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=brevet_ai_{pdf_type}_{datetime.now().strftime('%Y%m%d')}.pdf"}
    )

# ==================== ROOT ENDPOINT ====================

@api_router.get("/")
async def root():
    return {"message": "Brevet AI - Application de révision intelligente", "status": "ok"}

@api_router.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
