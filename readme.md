# 📱 SkillBridge

**SkillBridge** is a cross-platform mobile learning platform designed to bridge the gap between students and employers by enabling personalized microskill learning, AI-driven profile matching, and smart internship discovery.

---

## 🚀 Tech Stack

| Layer       | Technology                     |
|-------------|--------------------------------|
| Frontend    | React Native / Flutter         |
| Backend     | Supabase (Auth, DB, Storage)   |
| AI Engine   | Google Gemini AI API           |
| Search      | Vector Database (e.g., Pinecone / pgvector) |

---

## 🎯 Core Features

### 🔐 Authentication & User Management
- Dual role sign-up: **Students** & **Employers**
- Secure auth via **Supabase Auth**
- Role-based permissions and access control

### 👋 User Onboarding Flow

**For Students:**
- Education & skills  
- Interests and goals  
- Career preferences  
- Portfolio & resume upload  

**For Employers:**
- Company info & verification  
- Industry sector  
- Location & size  
- Document upload for validation  

### 🤖 AI-Powered Learning (via Gemini API)
- Auto-generated micro-courses  
- Learning objectives + content modules  
- Assessments & progress tracking  
- Certificate generation  

### 👤 Profile Management
- AI-powered parsing and vectorization  
- Dynamic skill taxonomy  
- Experience & achievement tagging  
- Profile scoring system  

### 🔎 Search & Discovery
- Vector-based profile similarity  
- NLP-powered search and filtering  
- Smart recommendations  
- Skill-based opportunity matching  

### 🧑‍💼 Opportunity Management

**Employers:**
- Internship/project listings  
- Application tracking & candidate evaluation tools  

**Students:**
- One-click applications  
- Status tracking  
- Save/bookmark features  
- Skill-matching insights  

### 📚 Learning Management
- Pre-built and AI-generated courses  
- Real-time progress tracking  
- Verified skills via badges  
- Digital certificates  

---

## 🧩 Database Schema (Supabase)

### `users`
- `id`, `email`, `role` (`student` / `employer`), `created_at`

### `profiles`
- `user_id`, `name`, `education`, `skills`, `interests`, `career_goals`, `resume_url`, `portfolio_url`, `vector`

### `companies`
- `user_id`, `company_name`, `industry`, `size`, `location`, `verified`, `documents`

### `opportunities`
- `company_id`, `title`, `description`, `skills_required`, `duration`, `location`, `work_mode`, `created_at`

### `applications`
- `student_id`, `opportunity_id`, `status`, `submitted_at`, `score`

### `courses`
- `id`, `title`, `description`, `objectives`, `content`, `assessments`, `generated_by_ai`

### `progress`
- `user_id`, `course_id`, `progress_percent`, `completed_modules`

### `certificates`
- `user_id`, `course_id`, `issue_date`, `certificate_url`

### `skills`
- `id`, `name`, `category`, `taxonomy_level`

### `vectors`
- `user_id`, `embedding`, `source` (profile/course/etc)

---

## 🛠️ Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/skillbridge.git
cd skillbridge
```

### 2. Set Up Supabase
- Go to [Supabase](https://supabase.com) and create a new project.
- Create the tables above or run the provided SQL schema.
- Copy your Supabase URL and `anon/public` key.

### 3. Configure Enviornment Variables
Create a `.env` file:
```.env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-google-gemini-api-key
```

### 4. Run the Mobile App
```bash
# For React Native:
npm install
npx expo start

# OR for Flutter
flutter pub get
flutter run
```

## 🤝 Contributing

Contributions are welcome! Please open issues and pull requests to enhance the platform.

1. Fork the repository  
2. Create your feature branch:  
   ```bash
   git checkout -b feature/your-feature
   ```
3. Commit your changeS:
    ```bash
    git commit -am 'Add new feature'
    ```
4. Push to the branch
    ```bash
    git push origin feature/your-feature
    ```
5. Open a Pull Request

## 📄 License
This project is licensed under the MIT License.

## 📫 Contact
For collaboration, partnership, or questions, reach out at:

📧 hello@skillbridge.app

🌐 www.skillbridge.app