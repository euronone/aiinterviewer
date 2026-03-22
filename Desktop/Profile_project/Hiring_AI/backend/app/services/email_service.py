"""
Email Service — AWS SES integration for interview invites, reminders, and calendar invites.
"""
from datetime import datetime
import boto3
from botocore.exceptions import ClientError
from app.core.config import settings


def _get_ses_client():
    return boto3.client(
        "ses",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION,
    )


async def send_interview_invite(
    to_email: str,
    candidate_name: str,
    match_score: int,
    schedule_link: str,
) -> bool:
    """Send interview scheduling invite to qualified candidate."""
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; margin: 0; padding: 0; }}
        .container {{ max-width: 580px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }}
        .header {{ background: linear-gradient(135deg, #6366f1, #d946ef); padding: 40px 32px; text-align: center; }}
        .header h1 {{ color: white; margin: 0; font-size: 28px; font-weight: 800; }}
        .header p {{ color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 15px; }}
        .body {{ padding: 32px; }}
        .score-badge {{ display: inline-block; background: #f0fdf4; color: #16a34a; border: 2px solid #bbf7d0; border-radius: 100px; padding: 8px 20px; font-weight: 700; font-size: 16px; margin: 16px 0; }}
        .cta-btn {{ display: inline-block; background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 700; font-size: 16px; margin: 24px 0; }}
        .steps {{ background: #f8fafc; border-radius: 12px; padding: 20px 24px; margin: 20px 0; }}
        .step {{ display: flex; gap: 12px; margin: 12px 0; font-size: 14px; color: #475569; }}
        .step-num {{ background: #6366f1; color: white; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; flex-shrink: 0; }}
        .footer {{ background: #f8fafc; padding: 20px 32px; text-align: center; font-size: 12px; color: #94a3b8; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Congratulations, {candidate_name}!</h1>
          <p>You've been shortlisted for an AI-powered interview</p>
        </div>
        <div class="body">
          <p style="color: #334155; font-size: 16px; line-height: 1.6;">
            We reviewed your application and you scored <strong style="color: #6366f1;">{match_score}%</strong> match against our requirements. We'd love to move forward!
          </p>
          
          <div class="score-badge">✅ {match_score}% Profile Match — Congratulations!</div>
          
          <p style="color: #64748b; font-size: 14px; line-height: 1.7;">
            Your interview will be conducted by <strong>HireAI</strong>, our AI interviewer. It's a conversational video + voice interview covering:
          </p>
          
          <div class="steps">
            <div class="step"><div class="step-num">1</div><span>Introduction & Background (8 mins)</span></div>
            <div class="step"><div class="step-num">2</div><span>Technical Assessment (20 mins)</span></div>
            <div class="step"><div class="step-num">3</div><span>Behavioural & HR Round (10 mins)</span></div>
            <div class="step"><div class="step-num">4</div><span>Salary Discussion (5 mins)</span></div>
          </div>
          
          <div style="text-align: center;">
            <a href="{schedule_link}" class="cta-btn">📅 Schedule Your Interview</a>
          </div>
          
          <p style="color: #94a3b8; font-size: 13px; text-align: center;">
            Please ensure a stable internet connection, a working camera and microphone, and a quiet environment.
          </p>
        </div>
        <div class="footer">
          <p>Powered by <strong>HireAI</strong> — AI-Powered Recruitment Platform</p>
          <p>If you have questions, reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
    """
    
    try:
        ses = _get_ses_client()
        ses.send_email(
            Source=f"HireAI <{settings.AWS_SES_FROM_EMAIL}>",
            Destination={"ToAddresses": [to_email]},
            Message={
                "Subject": {"Data": f"🎉 You're Shortlisted! Schedule Your AI Interview — HireAI"},
                "Body": {
                    "Html": {"Data": html_body},
                    "Text": {"Data": f"Congratulations {candidate_name}! You scored {match_score}% match. Schedule your interview: {schedule_link}"},
                },
            },
        )
        return True
    except ClientError as e:
        print(f"❌ SES error: {e}")
        return False


async def send_calendar_invite(
    to_email: str,
    candidate_name: str,
    job_title: str,
    scheduled_at: datetime,
    interview_link: str,
) -> bool:
    """Send calendar invite with interview link."""
    
    formatted_time = scheduled_at.strftime("%A, %B %d, %Y at %I:%M %p IST")
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; margin: 0; padding: 0; }}
        .container {{ max-width: 580px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }}
        .header {{ background: #0f172a; padding: 32px; text-align: center; }}
        .header h1 {{ color: white; margin: 0; font-size: 22px; font-weight: 700; }}
        .body {{ padding: 32px; }}
        .info-card {{ background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 20px; margin: 20px 0; }}
        .info-row {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0f2fe; font-size: 14px; }}
        .info-row:last-child {{ border-bottom: none; }}
        .info-label {{ color: #64748b; font-weight: 500; }}
        .info-value {{ color: #0f172a; font-weight: 600; }}
        .cta-btn {{ display: inline-block; background: #6366f1; color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; }}
        .tip {{ background: #fffbeb; border-left: 3px solid #f59e0b; padding: 12px 16px; border-radius: 0 8px 8px 0; font-size: 13px; color: #92400e; margin: 16px 0; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🗓️ Interview Confirmed — {job_title}</h1>
        </div>
        <div class="body">
          <p style="color: #334155; font-size: 15px;">Hi {candidate_name}, your interview is confirmed!</p>
          
          <div class="info-card">
            <div class="info-row">
              <span class="info-label">Position</span>
              <span class="info-value">{job_title}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date & Time</span>
              <span class="info-value">{formatted_time}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Duration</span>
              <span class="info-value">~45 minutes</span>
            </div>
            <div class="info-row">
              <span class="info-label">Format</span>
              <span class="info-value">AI Video + Voice Interview</span>
            </div>
          </div>
          
          <div style="text-align: center; margin: 24px 0;">
            <a href="https://hireai.app{interview_link}" class="cta-btn">🎬 Join Interview Room</a>
          </div>
          
          <div class="tip">
            💡 <strong>Pro Tips:</strong> Test your camera & mic beforehand. Find a quiet place with good lighting. Have a glass of water ready. Be yourself — the AI is trained to be fair!
          </div>
        </div>
      </div>
    </body>
    </html>
    """
    
    try:
        ses = _get_ses_client()
        ses.send_email(
            Source=f"HireAI <{settings.AWS_SES_FROM_EMAIL}>",
            Destination={"ToAddresses": [to_email]},
            Message={
                "Subject": {"Data": f"📅 Interview Confirmed: {job_title} — {formatted_time}"},
                "Body": {"Html": {"Data": html_body}},
            },
        )
        return True
    except ClientError as e:
        print(f"❌ SES calendar invite error: {e}")
        return False


async def send_assessment_ready(
    to_email: str,
    recruiter_name: str,
    candidate_name: str,
    job_title: str,
    overall_score: int,
    verdict: str,
    dashboard_link: str,
) -> bool:
    """Notify recruiter that assessment is ready."""
    verdict_emoji = {"strong_hire": "🟢", "hire": "🔵", "no_hire": "🔴"}.get(verdict, "⚪")
    
    html_body = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
      <div style="background: linear-gradient(135deg, #6366f1, #d946ef); padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 800;">📊 Assessment Ready</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0;">{candidate_name} — {job_title}</p>
      </div>
      <div style="padding: 32px;">
        <p>Hi {recruiter_name}, the AI assessment for <strong>{candidate_name}</strong> is ready.</p>
        <div style="display: flex; gap: 16px; margin: 24px 0;">
          <div style="flex: 1; text-align: center; background: #f8fafc; border-radius: 12px; padding: 20px;">
            <div style="font-size: 36px; font-weight: 800; color: #6366f1;">{overall_score}</div>
            <div style="font-size: 12px; color: #64748b; font-weight: 600;">OVERALL SCORE</div>
          </div>
          <div style="flex: 1; text-align: center; background: #f8fafc; border-radius: 12px; padding: 20px;">
            <div style="font-size: 28px;">{verdict_emoji}</div>
            <div style="font-size: 14px; font-weight: 700; color: #334155; text-transform: capitalize;">{verdict.replace('_', ' ')}</div>
          </div>
        </div>
        <div style="text-align: center; margin-top: 24px;">
          <a href="{dashboard_link}" style="display: inline-block; background: #6366f1; color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700;">View Full Report</a>
        </div>
      </div>
    </div>
    """
    
    try:
        ses = _get_ses_client()
        ses.send_email(
            Source=f"HireAI <{settings.AWS_SES_FROM_EMAIL}>",
            Destination={"ToAddresses": [to_email]},
            Message={
                "Subject": {"Data": f"📊 Assessment Ready: {candidate_name} scored {overall_score}/100 — {verdict_emoji}"},
                "Body": {"Html": {"Data": html_body}},
            },
        )
        return True
    except ClientError as e:
        print(f"❌ SES assessment notify error: {e}")
        return False
