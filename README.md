<div align="center">

<!-- Static, Visually Appealing Title -->
<h1>
  <span style="font-family: 'Georgia', serif; font-size: 4em; font-weight: 900; letter-spacing: -2px;">
    <span style="background: linear-gradient(135deg, #1E3A8A, #3B82F6, #06B6D4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; text-fill-color: transparent;">Support</span><span style="color: #000000;">Safe</span>
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

**SupportSafe** is a discreet, secure, and compassionate Gender-Based Violence (GBV) support platform. It empowers survivors in Kenya to seek help invisibly, understand their legal rights, and access emotional support, all while bypassing abuser surveillance and societal stigma.

Born from the urgent need to address Kenya's GBV crisis, SupportSafe combines **steganography**, **Large Language Models (LLMs)**, **Retrieval-Augmented Generation (RAG)**, and **AI avatar therapy** to create a multi-layered safety net for those who cannot safely reach out through conventional channels.

</div>

---

## 🚨 The Problem

In Kenya, domestic abuse is surging, but the vast majority of survivors suffer in silence:

- **75%** of survivors never seek formal help.
- **34%** of women and **24%** of men have experienced severe physical assault since age 15.
- **13%** of women and **7%** of men have survived forced sexual abuse.

### Why Existing Interventions Fail

| Barrier | Reality |
|---------|---------|
| **Abuser Surveillance** | Perpetrators monitor phone logs, messages, and location data. Calling a hotline leaves a trace. |
| **Social Stigma** | Extreme judgment prevents survivors—especially men and marginalized groups—from stepping forward. |
| **Legal Intimidation** | Protection orders and custody rights feel impossible without expensive legal counsel. |
| **Resource Scarcity** | GBV counselors and legal aid are concentrated in urban centers, leaving rural survivors with no access. |

---

## 💡 The Solution

SupportSafe provides a **secure, hidden pathway to safety and restoration** through three interconnected pillars.

<div align="center">
  <img src="https://img.shields.io/badge/Discreet%20SOS-Encoding%20Distress%20Signals-1E3A8A?style=flat-square" />
  <img src="https://img.shields.io/badge/Legal%20Rights%20Bot-Instant%20Guidance-3B82F6?style=flat-square" />
  <img src="https://img.shields.io/badge/AI%20Companion-24%2F7%20Emotional%20Support-06B6D4?style=flat-square" />
</div>

---

## ✨ Core Features

### 1️⃣ Discreet SOS Messaging
*The Silent Payload.*

A survivor types a few keywords about their situation. An LLM expands them into a full distress narrative. This message is embedded invisibly into an everyday photo using **steganography** and posted publicly with the hashtag **#IloveSupportSafe**. To the abuser, it looks like a harmless photo. To SupportSafe, it's a cry for help.

**The Pipeline:**

1. **Keyword Input:** Survivor types minimal keywords (e.g., "husband hitting me, two children, Kibera").
2. **LLM Expansion:** The message is expanded into a complete first-person distress narrative with all critical details—name, location, frequency, severity, perpetrator description.
3. **Image Generation:** A harmless carrier image is generated — a flower, a sunset, a landscape.
4. **Steganographic Encoding:** The distress message is embedded into the **least significant bit (LSB)** of every pixel's red channel. Visually, the image is identical.
5. **Social Media Posting:** The encoded image is posted to X (formerly Twitter) or Telegram SupportSafe Channel with Hashtag **#IloveSupportSafe**. Looks completely ordinary.
6. **Monitoring & Decoding:** A background scanner finds the hashtag, downloads the image, and applies **reverse steganography** to recover the message.
7. **Structured Processing:** The decoded message is parsed into 11 structured fields and stored in MongoDB.
8. **Responder Dashboard:** Authorized responders see all reports in real-time, sorted by urgency, with tools to forward cases to partner organizations.

![Discreet SOS Messaging](<Discreete SOS Messaging 1.png>)

![Discreet SOS Messaging](<Discreete SOS Messaging 2.png>)

![alt text](<Discreete SOS Messaging 3-1.png>)

![alt text](<Discreete SOS Messaging 4-1.png>)

![alt text](<Discreete SOS Messaging 6-1.png>)

### 2️⃣ Confidential Legal AI
*Demystifying Kenyan Statutes.*

Powered by **Retrieval-Augmented Generation (RAG)**, the Legal Rights Bot provides instant, plain-language guidance grounded in actual Kenyan law.

**How It Works:**
- Key legal document (The Constitution) is chunked and stored as vector embeddings in MongoDB Atlas.
- When a survivor asks a question, the system performs a semantic search to retrieve the most relevant legal passages.
- An LLM generates a clear, accurate answer grounded in retrieved context—not generic hallucinations.

![Legal AI](<Screenshot 2026-09-11 184202.png>)

![alt text](<Screenshot 2026-09-11 235041.png>)

### 3️⃣ AI Therapeutic Avatar
*Face-to-Face Healing:* secure, confidential first point of contact for survivors who cannot, or are not ready to speak to another human being.

3D lifelike avatar that enables face-to-face-style therapeutic conversations in a completely safe, anonymous environment.

**How It Works:**
- The survivor's messages are processed by the LLM, generating therapeutic responses.
- Text is converted to speech and processed through **Rhubarb Lip Sync** to generate viseme timelines.
- A 3D avatar renders in the browser using **Three.js**, with synchronized lip movements—creating a natural, lifelike speaking animation.

**Why an Avatar:**
- **Emotional Connection:** A face and voice create a stronger sense of being heard—critical for trauma recovery.
- **Reduced Isolation:** Provides a "presence" text alone cannot replicate.
- **Complete Anonymity:** No judgment, no fatigue, no risk of confidentiality breach.
- **Accessibility:** Works on any browser—no special hardware required.

![alt text](<AI Support companion-1.png>)

---

## 🏗 System Architecture

```mermaid
graph TD
    A[Survivor Device] -->|Types Keywords| B(LLM Expander)
    B -->|Full Distress Narrative| C(Steganography Engine)
    C -->|Innocuous Image + Hidden Payload| D[Public Social Media Post]
    
    E[Cron Scanner] -->|Detects #IloveSupportSafe| F[Reverse Steganography]
    F -->|Extracts Message| G[NLP Decomposition]
    G -->|Structured Data| H[(MongoDB)]
    H -->|Urgency Priority| I[Responder Dashboard]
    
    A -->|Direct Chat| J[AI Support Companion]
    A -->|Legal Queries| K[Legal Rights Bot RAG]
    A -->|Therapy Session| L[AI Avatar]
    L -->|Lip-Sync Audio| M[Rhubarb Lip Sync]
    M -->|3D Rendered Response| A