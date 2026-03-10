# 4.5 TABLE DESIGN

### 1. Tbl_users
Eg. Primary key: **uid**
Eg. Foreign key: **None**

| No: | Field name | Datatype (Size) | Key Constraints | Description of the field |
| :--- | :--- | :--- | :--- | :--- |
| 1 | uid | String (255) | Primary Key | Unique user authentication ID from Firebase Auth |
| 2 | name | String (100) | Not Null | Full name of the user or business name |
| 3 | email | String (100) | Unique, Not Null | Registered email address of the user |
| 4 | photoURL | String (500) | None | URL to the user's profile picture |
| 5 | role | String (20) | Not Null | User role: 'farmer', 'seller', or 'admin' |
| 6 | isPremium | Boolean | Default: false | Subscription status of the user |
| 7 | createdAt | Timestamp | Not Null | Account creation date and time |

---

### 2. Tbl_soil_readings
Eg. Primary key: **readingId**
Eg. Foreign key: **uid** references table **Tbl_users**

| No: | Field name | Datatype (Size) | Key Constraints | Description of the field |
| :--- | :--- | :--- | :--- | :--- |
| 1 | readingId | String (255) | Primary Key | Auto-generated unique ID for each reading |
| 2 | uid | String (255) | Foreign Key | ID of the user who owns this reading |
| 3 | nitrogen | Number | Not Null | Nitrogen level measured in mg/kg |
| 4 | phosphorus | Number | Not Null | Phosphorus level measured in mg/kg |
| 5 | potassium | Number | Not Null | Potassium level measured in mg/kg |
| 6 | ph | Number | Not Null | Soil pH level (range 0.0 - 14.0) |
| 7 | moisture | Number | Not Null | Soil moisture percentage (0 - 100%) |
| 8 | temperature | Number | Not Null | Soil temperature in Celsius (°C) |
| 9 | crop | String (50) | Not Null | The target crop for analysis (e.g., 'Wheat') |
| 10 | timestamp | Timestamp | Not Null | Date and time when the reading was recorded |

---

### 3. Tbl_crops
Eg. Primary key: **cropId**
Eg. Foreign key: **None**

| No: | Field name | Datatype (Size) | Key Constraints | Description of the field |
| :--- | :--- | :--- | :--- | :--- |
| 1 | cropId | String (255) | Primary Key | Unique ID/Slug for the crop species |
| 2 | name | String (50) | Unique, Not Null | Common name of the crop |
| 3 | description | String (1000) | None | General information about the crop |
| 4 | growingTips | String (2000) | None | Expert advice for optimal cultivation |
| 5 | marketValue | String (20) | None | Current market demand status (High/Medium/Low) |
| 6 | image | String (500) | None | Path or URL to the crop's illustrative image |
| 7 | ph_min | Number | Not Null | Minimum optimal pH for growth |
| 8 | ph_max | Number | Not Null | Maximum optimal pH for growth |
| 9 | n_min/max | Number | Not Null | Optimal Nitrogen range thresholds |
| 10 | p_min/max | Number | Not Null | Optimal Phosphorus range thresholds |
| 11 | k_min/max | Number | Not Null | Optimal Potassium range thresholds |
| 12 | moisture_range| Array/Numbers | Not Null | Optimal hydration requirements |

---

### 4. Tbl_products
Eg. Primary key: **id**
Eg. Foreign key: **seller_id** references table **Tbl_users**

| No: | Field name | Datatype (Size) | Key Constraints | Description of the field |
| :--- | :--- | :--- | :--- | :--- |
| 1 | id | String (255) | Primary Key | Unique ID for the marketplace product |
| 2 | seller_id | String (255) | Foreign Key | ID of the seller listing this product |
| 3 | name | String (100) | Not Null | Commercial name of the product |
| 4 | category | String (50) | Not Null | Grouping (e.g., 'Nitrogen Fertilizer') |
| 5 | description | String (1000) | None | Product specifications and benefits |
| 6 | price | Number | Not Null | Cost of the product in INR |
| 7 | stock | Number | Not Null | Current quantity available for purchase |
| 8 | image_url | String (500) | None | URL to the product image asset |
| 9 | created_at | Timestamp | Not Null | When the product was first listed |
| 10 | approved_at | Timestamp | None | When the admin authorized the listing |

---

### 5. Tbl_orders
Eg. Primary key: **orderId**
Eg. Foreign key: **uid** references table **Tbl_users**

| No: | Field name | Datatype (Size) | Key Constraints | Description of the field |
| :--- | :--- | :--- | :--- | :--- |
| 1 | orderId | String (255) | Primary Key | Unique transaction/order identifier |
| 2 | uid | String (255) | Foreign Key | ID of the farmer who placed the order |
| 3 | paymentId | String (100) | Unique | Gateway transaction ID (e.g., Razorpay) |
| 4 | items | JSON/Array | Not Null | List of items: id, name, price, quantity |
| 5 | total | Number | Not Null | Aggregate cost of the purchase |
| 6 | status | String (20) | Not Null | Lifecycle: 'Paid', 'Shipped', 'Delivered' |
| 7 | timestamp | Timestamp | Not Null | Finalized order date and time |

---

### 6. Tbl_alerts
Eg. Primary key: **alertId**
Eg. Foreign key: **uid** references table **Tbl_users**

| No: | Field name | Datatype (Size) | Key Constraints | Description of the field |
| :--- | :--- | :--- | :--- | :--- |
| 1 | alertId | String (255) | Primary Key | Unique alert notification ID |
| 2 | uid | String (255) | Foreign Key | ID of the farmer receiving the alert |
| 3 | type | String (50) | Not Null | Category (e.g., 'Acidic Soil Warning') |
| 4 | severity | String (10) | Not Null | Risk level: 'Low', 'Medium', 'High' |
| 5 | message | String (500) | Not Null | Detailed warning message for the user |
| 6 | isRead | Boolean | Default: false | Tracks if the user viewed the alert |
| 7 | timestamp | Timestamp | Not Null | When the system generated the warning |
