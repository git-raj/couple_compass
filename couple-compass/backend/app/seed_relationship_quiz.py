import asyncio
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.quiz import Quiz, QuizItem
from datetime import datetime

def create_relationship_quiz():
    """Create the relationship evaluation quiz with questions from relation_quiz.txt"""
    
    # Quiz categories with weights
    categories = {
        "communication": {
            "display_name": "Communication",
            "weight": 0.30,
            "description": "How well you and your partner communicate and resolve conflicts",
            "icon": "💬"
        },
        "trust_security": {
            "display_name": "Trust & Security", 
            "weight": 0.25,
            "description": "The level of trust and security in your relationship",
            "icon": "🔒"
        },
        "intimacy_affection": {
            "display_name": "Intimacy & Affection",
            "weight": 0.25,
            "description": "Emotional and physical intimacy in your relationship",
            "icon": "💕"
        },
        "support_partnership": {
            "display_name": "Support & Partnership",
            "weight": 0.20,
            "description": "How supportive and balanced your partnership is",
            "icon": "🤝"
        }
    }
    
    # Score interpretation ranges
    interpretation_ranges = [
        {
            "min_score": 85.0,
            "max_score": 100.0,
            "level": "strong",
            "title": "Strong & Healthy Relationship",
            "description": "Open communication, strong trust, deep connection, supportive partnership.",
            "color": "#10b981"  # green
        },
        {
            "min_score": 70.0,
            "max_score": 84.0,
            "level": "stable",
            "title": "Stable but Needs Growth", 
            "description": "Mostly positive but some weak spots to work on.",
            "color": "#3b82f6"  # blue
        },
        {
            "min_score": 55.0,
            "max_score": 69.0,
            "level": "strained",
            "title": "Strained Dynamics",
            "description": "Noticeable struggles; requires conscious effort to improve.",
            "color": "#f59e0b"  # yellow
        },
        {
            "min_score": 0.0,
            "max_score": 54.0,
            "level": "at_risk",
            "title": "At-Risk Relationship",
            "description": "Major issues in multiple areas; may need counseling or serious re-evaluation.",
            "color": "#ef4444"  # red
        }
    ]
    
    # Quiz questions with categories (from relation_quiz.txt)
    questions = [
        {
            "prompt": "How do you and your partner usually handle disagreements?",
            "category": "communication",
            "order": 1,
            "options": [
                {"label": "We calmly discuss and try to understand each other.", "value": "A", "points": 4},
                {"label": "We argue but usually resolve it fairly quickly.", "value": "B", "points": 3},
                {"label": "One of us withdraws while the other pushes to talk.", "value": "C", "points": 2},
                {"label": "Conflicts often escalate and feel unresolved.", "value": "D", "points": 1}
            ]
        },
        {
            "prompt": "How supported do you feel by your partner in your personal goals?",
            "category": "support_partnership",
            "order": 2,
            "options": [
                {"label": "Very supportive, they encourage me fully.", "value": "A", "points": 4},
                {"label": "Supportive, but sometimes distracted.", "value": "B", "points": 3},
                {"label": "Neutral—they don't interfere, but don't encourage either.", "value": "C", "points": 2},
                {"label": "Rarely supportive; sometimes dismissive of my goals.", "value": "D", "points": 1}
            ]
        },
        {
            "prompt": "How often do you feel truly listened to in conversations?",
            "category": "communication",
            "order": 3,
            "options": [
                {"label": "Almost always—I feel heard and understood.", "value": "A", "points": 4},
                {"label": "Often, though not every time.", "value": "B", "points": 3},
                {"label": "Sometimes, but often I feel ignored or misunderstood.", "value": "C", "points": 2},
                {"label": "Rarely—I feel my voice isn't valued.", "value": "D", "points": 1}
            ]
        },
        {
            "prompt": "How would you describe your trust level in the relationship?",
            "category": "trust_security",
            "order": 4,
            "options": [
                {"label": "Complete trust; I feel secure.", "value": "A", "points": 4},
                {"label": "Mostly trusting, with minor doubts.", "value": "B", "points": 3},
                {"label": "Trust has been broken but partly rebuilt.", "value": "C", "points": 2},
                {"label": "Low trust; I often feel uncertain.", "value": "D", "points": 1}
            ]
        },
        {
            "prompt": "How do you and your partner express affection?",
            "category": "intimacy_affection",
            "order": 5,
            "options": [
                {"label": "Regularly, both physically and verbally.", "value": "A", "points": 4},
                {"label": "Occasionally, usually when prompted.", "value": "B", "points": 3},
                {"label": "Rarely; affection feels one-sided.", "value": "C", "points": 2},
                {"label": "Almost never—we feel distant.", "value": "D", "points": 1}
            ]
        },
        {
            "prompt": "When facing challenges together, how do you both respond?",
            "category": "trust_security",
            "order": 6,
            "options": [
                {"label": "We team up and face it together.", "value": "A", "points": 4},
                {"label": "We try, but sometimes struggle to align.", "value": "B", "points": 3},
                {"label": "One partner takes most of the responsibility.", "value": "C", "points": 2},
                {"label": "We often blame each other instead of cooperating.", "value": "D", "points": 1}
            ]
        },
        {
            "prompt": "How satisfied are you with your emotional intimacy?",
            "category": "intimacy_affection",
            "order": 7,
            "options": [
                {"label": "Very satisfied—we're deeply connected.", "value": "A", "points": 4},
                {"label": "Fairly satisfied, but could be closer.", "value": "B", "points": 3},
                {"label": "Not very satisfied—I often feel distant.", "value": "C", "points": 2},
                {"label": "Dissatisfied—there's little emotional closeness.", "value": "D", "points": 1}
            ]
        },
        {
            "prompt": "How balanced is decision-making in your relationship?",
            "category": "support_partnership",
            "order": 8,
            "options": [
                {"label": "Very balanced—we both share input equally.", "value": "A", "points": 4},
                {"label": "Mostly balanced, though one leads sometimes.", "value": "B", "points": 3},
                {"label": "One of us usually dominates decisions.", "value": "C", "points": 2},
                {"label": "Imbalanced—my input is often disregarded.", "value": "D", "points": 1}
            ]
        },
        {
            "prompt": "How do you handle spending quality time together?",
            "category": "intimacy_affection",
            "order": 9,
            "options": [
                {"label": "We prioritize it regularly and enjoy it.", "value": "A", "points": 4},
                {"label": "We make time sometimes, but it's inconsistent.", "value": "B", "points": 3},
                {"label": "It's rare; life often gets in the way.", "value": "C", "points": 2},
                {"label": "Almost never—we feel disconnected.", "value": "D", "points": 1}
            ]
        },
        {
            "prompt": "How do you both handle apologies and forgiveness?",
            "category": "communication",
            "order": 10,
            "options": [
                {"label": "We openly apologize and forgive quickly.", "value": "A", "points": 4},
                {"label": "We apologize but sometimes hold onto resentment.", "value": "B", "points": 3},
                {"label": "Apologies happen rarely, forgiveness is difficult.", "value": "C", "points": 2},
                {"label": "We avoid apologies, issues remain unresolved.", "value": "D", "points": 1}
            ]
        }
    ]
    
    # Get database session
    db = next(get_db())
    
    try:
        # Check if quiz already exists
        existing_quiz = db.query(Quiz).filter(Quiz.slug == "relationship-evaluation").first()
        if existing_quiz:
            print("Relationship evaluation quiz already exists!")
            return existing_quiz
        
        # Create the quiz
        quiz = Quiz(
            slug="relationship-evaluation",
            title="💑 Relationship Evaluation Quiz",
            description="Discover insights about your relationship dynamics across communication, trust, intimacy, and partnership.",
            type="relationship_evaluation",
            is_active=True,
            order_index=1,
            categories_json=categories,
            interpretation_ranges=interpretation_ranges
        )
        
        db.add(quiz)
        db.commit()
        db.refresh(quiz)
        
        # Create quiz items
        quiz_items = []
        for question_data in questions:
            quiz_item = QuizItem(
                quiz_id=quiz.id,
                prompt=question_data["prompt"],
                kind="multiple_choice",
                options_json=question_data["options"],
                order_index=question_data["order"],
                category=question_data["category"],
                category_weight=1.0
            )
            quiz_items.append(quiz_item)
            db.add(quiz_item)
        
        db.commit()
        
        print(f"✅ Successfully created relationship evaluation quiz with {len(quiz_items)} questions!")
        print(f"Quiz ID: {quiz.id}")
        print(f"Categories: {', '.join(categories.keys())}")
        
        return quiz
        
    except Exception as e:
        print(f"❌ Error creating quiz: {e}")
        db.rollback()
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    create_relationship_quiz()
