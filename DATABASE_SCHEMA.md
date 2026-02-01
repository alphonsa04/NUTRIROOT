# Database Schema Design - NutriRoot (Firebase Firestore)

**Database Type**: NoSQL Document Database (Google Cloud Firestore)

Unlike traditional SQL databases (tables, rows, columns), Firestore uses **Collections** (folders) and **Documents** (files). Each document contains fields (key-value pairs) and can contain Sub-collections.

## 1. **Users Collection** (`/users`)
Stores user profile information and role-based access control.

*   **Collection Path**: `users`
*   **Document ID**: `uid` (Type: String, distinct Auth User ID)

| Field | Type | Description |
| :--- | :--- | :--- |
| `uid` | String | Unique User ID (Primary Key equivalent) |
| `name` | String | Full Name of the user |
| `email` | String | User email address |
| `photoURL` | String | URL to profile picture (or default) |
| `role` | String | Access role: `'farmer'` or `'admin'` |
| `isPremium` | Boolean | `true` if premium subscriber, else `false` |
| `createdAt` | Timestamp | Account creation date |

---

## 2. **Soil Data Collection** (`/soilData`)
Stores historical soil analysis readings for each user. Organized by User ID.

*   **Collection Path**: `soilData`
*   **Document ID**: `uid` (The user's ID)
*   **Sub-collection**: `readings` (Contains the actual data points)

### Sub-collection: Readings (`/soilData/{uid}/readings`)

*   **Collection Path**: `soilData/{uid}/readings`
*   **Document ID**: `readingId` (Auto-generated UUID)

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String | The unique ID of this reading |
| `nitrogen` | Number | Nitrogen level (mg/kg) |
| `phosphorus` | Number | Phosphorus level (mg/kg) |
| `potassium` | Number | Potassium level (mg/kg) |
| `ph` | Number | Soil pH level (0-14) |
| `moisture` | Number | Soil moisture percentage (0-100) |
| `temperature` | Number | Soil temperature (°C) |
| `crop` | String | Target crop for this analysis (e.g., 'Wheat') |
| `timestamp` | String/Timestamp | ISO date string or Firestore Timestamp of recording |

---

## 3. **Crops Collection** (`/crops`)
The knowledge base for crop requirements. Publicly readable, Admin writable.

*   **Collection Path**: `crops`
*   **Document ID**: `cropId` (Auto-generated or Crop Name slug)

| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | String | Name of the crop (e.g., 'Rice') |
| `description` | String | Short description of the crop |
| `growingTips` | String | Advice for growing this crop |
| `marketValue` | String | Market demand info (e.g., 'High') |
| `image` | String | Path to crop image asset |
| `soilRequirements` | Map (Object) | Nested object containing optimal ranges |

**`soilRequirements` Object Structure:**
| Field | Type | Description |
| :--- | :--- | :--- |
| `ph` | Array [min, max] | Optimal pH range (e.g., `[5.5, 7.0]`) |
| `nitrogen` | Array [min, max] | Optimal Nitrogen range |
| `phosphorus` | Array [min, max] | Optimal Phosphorus range |
| `potassium` | Array [min, max] | Optimal Potassium range |
| `moisture` | Array [min, max] | Optimal Moisture range |
| `temperature` | Array [min, max] | Optimal Temperature range |

---

## 4. **Alerts & Recommendations**
*Note: In the current NoSQL architecture, specific "Alert" or "Recommendation" documents are often generated dynamically on the client-side based on the `soilData` and `crops` knowledge base. However, if they were to be stored for history, they would follow this structure:*

### Optional: Alerts Collection (`/alerts/{uid}/userAlerts`)
*   **Document ID**: `alertId`

| Field | Type | Description |
| :--- | :--- | :--- |
| `type` | String | Alert category (e.g., 'Acidic Soil') |
| `severity` | String | 'low', 'medium', 'high' |
| `message` | String | The warning text shown to user |
| `timestamp` | Timestamp | When the alert was generated |
| `isRead` | Boolean | Whether the user has seen it |

---
