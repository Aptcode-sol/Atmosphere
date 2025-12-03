# Atmosphere API Documentation

Base URL: `http://localhost:4000/api`

## Authentication

All protected routes require a JWT token in the Authorization header:

```bash
Authorization: Bearer <token>
```

### Auth Routes

#### POST /auth/register

Register a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "password123",
  "displayName": "John Doe",
  "accountType": "startup" | "investor" | "personal"
}
```

**Response:** `201 Created`

```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "username": "johndoe",
    "displayName": "John Doe",
    "roles": ["startup"],
    "avatarUrl": null
  }
}
```

#### POST /auth/login

Login with email and password.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`

```json
{
  "token": "jwt_token_here",
  "user": { ... }
}
```

#### GET /auth/me

Get current authenticated user (requires auth).

**Response:** `200 OK`

```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "username": "johndoe",
    ...
  }
}
```

---

## Users

### GET /users/:identifier

Get user by ID or username.

**Response:** `200 OK`

```json
{
  "user": { ... }
}
```

#### PUT /users/:id

Update user profile (requires auth, owner only).

**Request Body:**

```json
{
  "displayName": "New Name",
  "bio": "My bio",
  "avatarUrl": "https://...",
  "links": {
    "website": "https://...",
    "linkedin": "https://..."
  }
}
```

#### GET /users/:id/posts

Get user's posts.

**Query Params:**

- `limit` (default: 20)
- `skip` (default: 0)

---

## Posts

### POST /posts

Create a new post (requires auth).

**Request Body:**

```json
{
  "content": "Post content",
  "media": [
    { "url": "https://...", "type": "image", "thumbUrl": "https://..." }
  ],
  "tags": ["tech", "startup"],
  "visibility": "public" | "private"
}
```

#### GET /posts

Get posts feed.

**Query Params:**

- `limit` (default: 20)
- `skip` (default: 0)
- `userId` (filter by author)
- `tag` (filter by tag)

#### GET /posts/:id

Get single post by ID.

#### PUT /posts/:id

Update post (requires auth, owner only).

#### DELETE /posts/:id

Delete post (requires auth, owner only).

#### POST /posts/:id/like

Like a post (requires auth).

#### DELETE /posts/:id/like

Unlike a post (requires auth).

---

## Comments

### POST /posts/:postId/comments

Add comment to post (requires auth).

**Request Body:**

```json
{
  "text": "Comment text",
  "parent": "parent_comment_id_optional"
}
```

#### GET /posts/:postId/comments

Get comments for a post.

**Query Params:**

- `limit` (default: 50)
- `skip` (default: 0)

#### GET /comments/:id/replies

Get replies to a comment.

#### PUT /comments/:id

Update comment (requires auth, owner only).

#### DELETE /comments/:id

Delete comment (requires auth, owner only).

---

## Follows

### POST /follows/:userId

Follow a user (requires auth).

#### DELETE /follows/:userId

Unfollow a user (requires auth).

#### GET /follows/:userId/followers

Get user's followers.

**Query Params:**

- `limit` (default: 20)
- `skip` (default: 0)

#### GET /follows/:userId/following

Get users that user is following.

#### GET /follows/check/:userId

Check if current user follows target user (requires auth).

---

## Companies

### POST /companies

Create a company (requires auth).

**Request Body:**

```json
{
  "name": "Company Name",
  "slug": "company-name",
  "website": "https://...",
  "logoUrl": "https://...",
  "description": "Company description",
  "tags": ["fintech", "b2b"]
}
```

#### GET /companies

Get companies list.

**Query Params:**

- `limit` (default: 20)
- `skip` (default: 0)
- `tag` (filter by tag)
- `search` (search by name)

#### GET /companies/:slug

Get company by slug.

#### PUT /companies/:id

Update company (requires auth, employee only).

#### GET /companies/trending/list

Get trending companies.

---

## Startup Details

### POST /startup-details

Create startup details (requires auth).

**Request Body:**

```json
{
  "companyName": "Startup Inc",
  "about": "About the startup",
  "location": "San Francisco, CA",
  "companyType": "SaaS",
  "establishedOn": "2023-01-01",
  "address": "123 Main St",
  "teamMembers": [{ "name": "John Doe", "role": "CEO" }],
  "financialProfile": {
    "revenueType": "Capital Raised",
    "fundingAmount": 1000000,
    "stages": ["Seed"]
  },
  "previousInvestments": []
}
```

#### GET /startup-details/:userId

Get startup details by user ID.

#### PUT /startup-details/:id

Update startup details (requires auth, owner only).

---

## Investor Details

### POST /investor-details

Create investor details (requires auth).

**Request Body:**

```json
{
  "about": "About investor",
  "location": "New York, NY",
  "investmentFocus": ["fintech", "saas"],
  "interestedRounds": ["Seed", "Series A"],
  "stage": "Early Stage",
  "geography": ["US", "Europe"],
  "checkSize": {
    "min": 50000,
    "max": 500000
  }
}
```

#### GET /investor-details/:userId

Get investor details by user ID.

#### PUT /investor-details/:id

Update investor details (requires auth, owner only).

#### GET /investor-details

List all investors with filters.

**Query Params:**

- `limit` (default: 20)
- `skip` (default: 0)
- `focus` (filter by investment focus)
- `round` (filter by interested round)
- `stage` (filter by stage)

---

## Notifications

### GET /notifications

Get user's notifications (requires auth).

**Query Params:**

- `limit` (default: 50)
- `skip` (default: 0)
- `unreadOnly` (true/false)

**Response:**

```json
{
  "notifications": [...],
  "unreadCount": 5
}
```

#### PUT /notifications/:id/read

Mark notification as read (requires auth).

#### PUT /notifications/read-all

Mark all notifications as read (requires auth).

#### POST /notifications

Create notification (internal/admin use).

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request

```json
{
  "error": "Error message"
}
```

### 401 Unauthorized

```json
{
  "error": "No token provided" | "Invalid or expired token"
}
```

### 403 Forbidden

```json
{
  "error": "Forbidden"
}
```

### 404 Not Found

```json
{
  "error": "Resource not found"
}
```

### 409 Conflict

```json
{
  "error": "Resource already exists"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal Server Error"
}
```

---

## Environment Variables

Required environment variables in `.env`:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/atmosphere_dev
JWT_SECRET=your-secret-key-change-in-production
PORT=4000
ADMIN_EMAIL=admin@local.dev
ADMIN_PASSWORD=adminpass
```

---

## Testing the API

You can test the API using curl, Postman, or any HTTP client:

```bash
# Register
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","username":"testuser","password":"pass123"}'

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass123"}'

# Get posts (with auth)
curl http://localhost:4000/api/posts \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```
