# Lesson Management API

This document describes the new lesson management functionality added to the API.

## Overview

Teachers can now create, update, delete, and manage lessons. Each lesson has:

- Title (required)
- Description (required)
- Image (optional)
- Teacher ID (automatically assigned)
- Creation and update timestamps

## API Endpoints

### 1. Create a Lesson

**POST** `/api/lessons`

- **Authorization**: Required (Teacher only)
- **Content-Type**: `multipart/form-data`
- **Body**:
  - `title` (string, required)
  - `description` (string, required)
  - `lessonImage` (file, optional) - Image file for the lesson

**Example using curl:**

```bash
curl -X POST http://localhost:3000/api/lessons \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "title=Introduction to JavaScript" \
  -F "description=Learn the basics of JavaScript programming" \
  -F "lessonImage=@lesson-image.jpg"
```

### 2. Get All Lessons

**GET** `/api/lessons`

- **Authorization**: Not required
- Returns all lessons with teacher information

### 3. Get Teacher's Own Lessons

**GET** `/api/lessons/my`

- **Authorization**: Required (Teacher only)
- Returns lessons created by the authenticated teacher

### 4. Update a Lesson

**PUT** `/api/lessons/:lessonId`

- **Authorization**: Required (Teacher only, can only update own lessons)
- **Content-Type**: `multipart/form-data`
- **Body**: Same as create lesson (all fields optional for updates)

### 5. Delete a Lesson

**DELETE** `/api/lessons/:lessonId`

- **Authorization**: Required (Teacher only, can only delete own lessons)

## Response Examples

### Create/Update Lesson Success Response:

```json
{
  "message": "Lesson created successfully",
  "lesson": {
    "_id": "lesson_id_here",
    "title": "Introduction to JavaScript",
    "description": "Learn the basics of JavaScript programming",
    "image": "uploads/1234567890.jpg",
    "teacherId": {
      "_id": "teacher_id_here",
      "firstName": "John",
      "lastName": "Doe",
      "email": "teacher@example.com"
    },
    "createdAt": "2025-08-08T10:00:00.000Z",
    "updatedAt": "2025-08-08T10:00:00.000Z"
  }
}
```

### Get Lessons Response:

```json
[
  {
    "_id": "lesson_id_here",
    "title": "Introduction to JavaScript",
    "description": "Learn the basics of JavaScript programming",
    "image": "uploads/1234567890.jpg",
    "teacherId": {
      "_id": "teacher_id_here",
      "firstName": "John",
      "lastName": "Doe",
      "email": "teacher@example.com"
    },
    "createdAt": "2025-08-08T10:00:00.000Z",
    "updatedAt": "2025-08-08T10:00:00.000Z"
  }
]
```

## Error Responses

- **403 Forbidden**: When a non-teacher tries to create/update/delete lessons
- **404 Not Found**: When lesson doesn't exist
- **400 Bad Request**: When required fields are missing
- **500 Internal Server Error**: Server-side errors

## Notes

- Only users with `type: "teacher"` can create, update, or delete lessons
- Teachers can only update/delete their own lessons
- Images are optional and stored in the `uploads/` directory
- The lesson image field name is `lessonImage` (different from profile images which use `profileImage`)
- All lessons are publicly viewable via the GET `/api/lessons` endpoint
- Images are served statically at the `/uploads/` route
