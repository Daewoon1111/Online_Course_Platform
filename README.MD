# Online Course Platform

React + Bootstrap frontend (`frontend/`), Django REST API (`backend/`), AI features through OpenRouter.

## Structure

```
backend/
  config/      Django project (settings, urls). Serves the built React app in production.
  users/       Custom User (role: student | teacher | admin), token auth, /api/teachers/
  courses/     Course, Lesson, Enrollment, Order, OrderItem + course/order API, lesson Q&A and quiz endpoints
  content/     Podcast, Article, Testimonial (AI-labelled), ContactMessage
  ai/          OpenRouter client (llm.py) and AI features (services.py): advisor chat, moderation, drafts, RAG, quiz
  media/       Uploaded images (seed thumbnails/covers)
database/
  erd.md       Schema diagram, constraints, derived values
  seed.json    Sample data (courses, lessons, podcasts, articles, comments)
frontend/
  src/pages/       Home, CourseDetail, ArticleDetail, Cart, Account, About, NotFound (lazy-loaded)
  src/components/  Layout (navbar/footer), CourseCard, ChatWidget, CourseAssistant (Q&A + quiz), ui helpers
  src/api.js       fetch wrapper + useApi hook;  src/store.jsx  auth + cart context
archive/static-frontend/   Old static HTML version (kept for reference, safe to delete)
package.json, scripts/py.mjs   One-command setup and dev run for the whole project
```
| Feature                                     | Where                                                            | Who decides                                                                                         |
| ------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Course advisor chat                         | Chat button on every page, `POST /api/chat/`                     | AI suggests courses using live DB data (tools). Prices, enrollment and payment stay with the system |
| Comment moderation                          | Runs when a comment is posted; admin action "AI: check selected" | AI labels clean / spam / toxic. Only an admin approves (`is_approved`)                              |
| Course description / article summary drafts | Admin actions "AI: write ... drafts"                             | AI writes into `*_draft` fields. Admin reviews, then "Apply reviewed drafts"                        |
| Lesson Q&A (RAG)                            | Course page, enrolled users, `POST /api/courses/<slug>/ask/`     | Answers only from that course's lesson paragraphs, shows sources                                    |
| Practice quiz                               | Course page, enrolled users, `POST /api/courses/<slug>/quiz/`    | AI generates questions from lessons; the browser grades them; nothing is stored                     |

OpenRouter has no batch discount API, so admin drafts run 4 requests in parallel instead.
Retrieval is keyword-based over lesson paragraphs; switch to embeddings + pgvector when lessons grow.

## API

| Method    | Endpoint                                                                      | Notes                                                                                                         |
| --------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| GET       | `/api/courses/`, `/api/courses/<slug>/`                                       | Published courses with `students`, `on_sale`, `current_price`, `discount_percent`; `?search=`                 |
| GET       | `/api/courses/<slug>/lessons/`                                                | `{enrolled, lessons}`; content only for enrolled users, the teacher and staff                                 |
| POST      | `/api/courses/<slug>/ask/`, `/api/courses/<slug>/quiz/`                       | AI lesson Q&A and quiz (enrolled only)                                                                        |
| GET       | `/api/courses/mine/`                                                          | Courses the logged-in user is enrolled in                                                                     |
| GET       | `/api/podcasts/`, `/api/articles/`, `/api/articles/<slug>/`, `/api/teachers/` | Public content                                                                                                |
| GET, POST | `/api/testimonials/`                                                          | Approved comments; POST (logged in) creates one that waits for admin approval                                 |
| POST      | `/api/contact/`                                                               | Contact form                                                                                                  |
| POST      | `/api/chat/`                                                                  | `{"messages": [{"role": "user", "content": "..."}]}` → `{reply, courses}`                                     |
| POST      | `/api/auth/register/`, `/api/auth/login/`                                     | Return `{token, user}`; login accepts username or email                                                       |
| POST      | `/api/auth/logout/` · GET `/api/auth/me/`                                     | Need `Authorization: Token <token>`                                                                           |
| GET, POST | `/api/orders/`                                                                | My orders; POST `{"courses": [ids]}` creates a pending order with price snapshot                              |
| POST      | `/api/orders/<id>/pay/`                                                       | **Mock payment, only when `DJANGO_DEBUG=1`.** Replace with a real gateway (VNPay, MoMo, Stripe) before launch |
