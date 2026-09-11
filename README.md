<div align="center">

<!-- Static, Visually Appealing Title -->
<h1>
  <span style="font-family: 'Georgia', serif; font-size: 4em; font-weight: 900; background: linear-gradient(135deg, #1E3A8A, #3B82F6, #06B6D4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; text-fill-color: transparent; letter-spacing: -2px;">
    SupportSafe
  </span>
</h1>

<!-- Typing Animation Subtitle -->
<a href="https://git.io/typing-svg">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=22&pause=1000&color=3B82F6&center=true&vCenter=true&width=800&height=60&lines=A+Safer+Way+to+Seek+Help;Breaking+the+Silence+of+GBV;Discreet.+Secure.+Compassionate.;Empowering+Survivors+in+Kenya" alt="Typing SVG" />
</a>

<br>

<!-- Badges -->
<img src="https://img.shields.io/badge/Status-In%20Development-3B82F6?style=for-the-badge&logo=git&logoColor=white" alt="Status" />
<img src="https://img.shields.io/badge/Region-Kenya-06B6D4?style=for-the-badge&logo=googlemaps&logoColor=white" alt="Region" />
<img src="https://img.shields.io/badge/Focus-GBV%20Support-1E3A8A?style=for-the-badge&logo=heart&logoColor=white" alt="Focus" />
<img src="https://img.shields.io/badge/License-MIT-60A5FA?style=for-the-badge" alt="License" />

<br><br>

**SupportSafe** is a discreet, secure, and compassionate Gender-Based Violence (GBV) support platform. It empowers survivors in Kenya to seek help invisibly, understand their legal rights, and access emotional support—all while bypassing abuser surveillance and societal stigma.

</div>

---

## 📖 Table of Contents

- [The Problem](#-the-problem)
- [The Solution](#-the-solution)
- [Core Features](#-core-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [How It Works](#-how-it-works)
- [The Team & Vision](#-the-team--vision)
- [Contributing](#-contributing)
- [Contact](#-contact)

---

## 🚨 The Problem

In Kenya, domestic abuse is surging, but the vast majority of survivors suffer in silence. 

- **75%** of survivors never seek formal medical, legal, or psychological help.
- **34%** of women and **24%** of men have experienced severe physical assault since age 15.
- **13%** of women and **7%** of men have survived forced sexual abuse.

**Why do existing interventions fail?**
1. **Abuser Surveillance:** Perpetrators routinely monitor phone logs, social media, and messages. Calling a hotline is often too dangerous.
2. **Social Stigma:** Extreme societal judgment prevents survivors (especially men and marginalized groups) from stepping forward.
3. **Intimidating Legal Barriers:** Navigating protection orders and custody rights without expensive legal counsel is overwhelming.

---

## 💡 The Solution

SupportSafe provides a **secure, hidden pathway to safety and restoration**. It operates on three core pillars designed to protect the survivor at every step.

<div align="center">
  <img src="https://img.shields.io/badge/Discreet%20SOS-Encoding%20Distress%20Signals-1E3A8A?style=flat-square" />
  <img src="https://img.shields.io/badge/Legal%20Rights%20Bot-Instant%20Guidance-3B82F6?style=flat-square" />
  <img src="https://img.shields.io/badge/AI%20Companion-24%2F7%20Emotional%20Support-06B6D4?style=flat-square" />
</div>

---

## ✨ Core Features

### 1️⃣ Discreet SOS Messaging (Steganography + LLM)
*The Silent Payload.*

Many survivors cannot safely call a hotline or post openly. SupportSafe lets a user type a few keywords describing the situation. 
- **LLM Expansion:** An integrated Large Language Model expands these keywords into a full, coherent distress message.
- **Invisible Embedding:** The message is programmatically embedded into an everyday photo (a flower, a sunset, a meal) using **steganography**. 
- **Zero Suspicion:** The image looks completely ordinary and can be posted publicly. A background cron job scans for these images, decodes the signal, and alerts responders.

### 2️⃣ Confidential Legal AI (RAG + Kenyan Law)
*Demystifying Kenyan Statutes.*

Navigating the legal system is intimidating. Our AI Legal Rights Bot provides:
- **Protection Orders:** Plain-language explanations of how to file and enforce Protection Orders under the Kenyan *Protection Against Domestic Violence Act*.
- **Custody & Rights:** Instant, clear assistance regarding child custody, co-parenting structures, and custody rights during emergency separation.
- **Safe Referral Network:** Vetted referrals to pro-bono law organizations and GBV hotlines in Kenya.

### 3️⃣ 24/7 AI Support Companion (Trauma-Informed)
*The Emotional Lifeline.*

Due to severe social stigma, many survivors never seek traditional therapy. Our AI companion serves as a secure, confidential first point of contact.
- **Instant Grounding Techniques:** Interactive guidance on deep breathing, calming exercises, and cognitive refocusing during acute distress.
- **Trauma-Informed Responses:** Carefully tuned conversational paths that offer validation, reduce guilt, and foster emotional safety.
- **No Judgment:** Available 24/7, it never judges, breaks confidentiality, or carries bias.

---

## 🏗 System Architecture

SupportSafe is engineered for **discretion, healing, and empowerment**.

```mermaid
graph TD
    A[Survivor Device] -->|Types Keywords| B(LLM Expander)
    B -->|Full Distress Narrative| C(Steganography Engine)
    C -->|Innocuous Image + Hidden Payload| D[Public Social Media Post]
    
    E[Cron Scanner] -->|Detects Image| F[Reverse Steganography]
    F -->|Extracts Message| G[NLP Decomposition]
    G -->|Structured Data| H[(MongoDB)]
    H -->|Urgency Priority| I[Responder Dashboard]
    
    A -->|Direct Chat| J[AI Support Companion]
    A -->|Legal Queries| K[Legal Rights Bot RAG]
