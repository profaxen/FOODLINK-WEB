# FoodLink - Complete Implementation Guide

## Overview

FoodLink is a React.js web application that connects food donors with receivers to reduce food waste. The app operates entirely on Firebase's Spark (Free Tier) plan with zero running costs.

## Project Structure

```
FoodLink/
├── client/
│   ├── components/          # Reusable UI components
│   │   └── ui/             # Shadcn UI components
│   ├── hooks/              # Custom React hooks
│   ├── layouts/            # Layout components
│   │   └── MainLayout.tsx  # Main layout with navigation
│   ├── lib/
│   │   ├── firebase.ts     # Firebase configuration and initialization
│   │   └── utils.ts        # Utility functions
│   ├── pages/              # Route pages
│   │   ├── Auth.tsx        # Login/Signup page
│   │   ├── Index.tsx       # Home page with available listings
│   │   ├── CreatePost.tsx  # Create food listing (donors only)
│   │   ├── FoodPostDetail.tsx # Listing details page
│   │   ├── DonorDashboard.tsx # Donor control panel
│   │   ├── ReceiverDashboard.tsx # Receiver browsing page
│   │   ├── Requests.tsx    # Donor's incoming requests
│   │   ├── MyRequests.tsx  # Receiver's sent requests
│   │   ├── Profile.tsx     # User profile
│   │   └── ...other pages
│   ├── App.tsx             # Main app component with routing
│   └── global.css          # Global styles
├── public/                 # Static assets
├── docs/                   # Documentation
├── SECURITY_RULES.md       # Firestore & Storage security rules
└── package.json            # Dependencies
```

## Technologies Used

| Technology | Purpose |
|---|---|
| **React.js** | Frontend framework |
| **Vite** | Build tool and dev server |
| **react-router-dom** | Client-side routing |
| **Firebase Auth** | User authentication (Email/Password, Google Sign-In) |
| **Firebase Firestore** | NoSQL database for all data |
| **Firebase Storage** | Image upload and storage |
| **Tailwind CSS** | Styling (via shadcn/ui) |
| **Sonner** | Toast notifications |
| **Lucide Icons** | Icon library |
| **Framer Motion** | Animations |

## Installation & Setup

### Step 1: Prerequisites

Ensure you have the following installed:
- Node.js (v18+)
- npm or yarn
- Git

### Step 2: Clone and Install

```bash
# Clone the repository (if not already cloned)
git clone <repository-url>
cd FoodLink

# Install dependencies
npm install
# or
yarn install
```

### Step 3: Environment Configuration

The Firebase configuration is already set in environment variables:

```
VITE_FIREBASE_PROJECT_ID="foodlink-firebase-project"
VITE_FIREBASE_API_KEY="AIzaSyATD894klbtuI_v6BZKroNr2iWK-X1e5xU"
VITE_FIREBASE_AUTH_DOMAIN="foodlink-firebase-project.firebaseapp.com"
VITE_FIREBASE_STORAGE_BUCKET="foodlink-firebase-project.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="670115472727"
VITE_FIREBASE_APP_ID="1:670115472727:web:f69cd69c2659d6331e8a12"
VITE_FIREBASE_MEASUREMENT_ID="G-NHFHYM0JYZ"
```

These are automatically loaded by Vite.

### Step 4: Set Up Firebase Security Rules

⚠️ **CRITICAL STEP**: Without proper security rules, your app will not work correctly and will be insecure.

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select the "foodlink-firebase-project" project
3. Follow the instructions in `SECURITY_RULES.md` to apply Firestore and Storage rules

### Step 5: Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the port shown in terminal).

## Database Schema

### Firestore Collections

#### `users` Collection
Stores user profile information.

```javascript
users/{uid} = {
  role: 'donor' | 'receiver',  // User role (permanent after signup)
  name: string,                 // User's full name
  email: string,                // User's email
  phone: string,                // User's phone (optional)
  createdAt: timestamp,         // Account creation date
  updatedAt: timestamp          // Last profile update
}
```

#### `listings` Collection
Stores all food donation listings.

```javascript
listings/{listingId} = {
  title: string,                    // Food donation title
  description: string,              // Detailed description
  quantity: string,                 // Quantity (e.g., "10 plates")
  locationText: string,             // Pickup location
  category: 'veg' | 'non-veg',     // Food category
  status: 'available' | 'reserved', // Current status
  donorId: string,                  // UID of the donor
  donorName: string,                // Name of the donor
  imageUrl: string,                 // URL to image in Firebase Storage
  createdAt: timestamp,             // When listing was created
}
```

#### `requests` Collection
Stores all food requests from receivers.

```javascript
requests/{requestId} = {
  listingId: string,           // Reference to the listing
  receiverId: string,          // UID of the receiver
  receiverName: string,        // Name of the receiver
  status: 'pending' | 'accepted' | 'rejected',  // Request status
  requestedAt: timestamp,      // When request was made
}
```

### Firebase Storage Structure

Images are stored in:
```
gs://foodlink-firebase-project.firebasestorage.app/listing_images/{timestamp}-{filename}
```

## Application Flow

### User Registration

1. User visits `/auth` page
2. Selects "Signup" mode
3. Chooses role: **Donor** or **Receiver** (permanent choice)
4. Enters name, email, password
5. Account created in Firebase Auth, user document saved to Firestore

### Donor Workflow

1. **Create Listing** (`/create`)
   - Fill form: Title, Description, Quantity, Location, Category
   - Upload image → Uploaded to Firebase Storage
   - Click "Create Listing" → Saved to `listings` collection with status='available'

2. **View Dashboard** (`/dashboard`)
   - See "My Listings" (all their listings)
   - See summary stats (active, reserved, pending requests)

3. **Manage Requests** (`/requests`)
   - View all incoming requests from receivers
   - Accept → Updates request status='accepted' and listing status='reserved'
   - Reject → Updates request status='rejected'

### Receiver Workflow

1. **Browse Listings** (`/dashboard/receiver`)
   - View all available listings (status='available')
   - Filter by category (Veg/Non-Veg)
   - Click on listing card to view details

2. **View Listing Details** (`/listing/:id`)
   - See full listing information
   - View image
   - Click "Request Food" to send request

3. **Track Requests** (`/my-requests`)
   - View all sent requests
   - See status: Pending, Accepted, or Rejected
   - Can view original listing details

## Key Features

### Role-Based Access Control
- Only donors can access `/create` and `/dashboard`
- Only receivers can access `/dashboard/receiver` and `/my-requests`
- Different navigation based on role

### Image Management
- Images uploaded to Firebase Storage (free tier)
- Download URLs stored in Firestore
- Supports JPG, PNG, GIF formats
- Max 5MB per image

### Real-Time Updates
- Listings update instantly using Firestore subscriptions
- Request status changes reflected immediately
- No page refresh needed

### Security
- Users can only modify their own data
- Donors can only manage their own listings
- Receivers can only create requests, not view others' requests
- All access controlled via Firestore security rules

## API Endpoints / Data Flow

### Creating a Listing (Donor)

```
POST /listings
{
  title: "Fresh Biryani",
  description: "Home-made biryani, vegetarian",
  quantity: "10 plates",
  locationText: "123 Main St, City",
  category: "veg",
  imageUrl: "gs://...listing_images/...",
  status: "available"
}
```

Response: Listing created with auto-generated `listingId`

### Requesting Food (Receiver)

```
POST /requests
{
  listingId: "abc123...",
  receiverId: "user_uid...",
  receiverName: "John Doe",
  status: "pending"
}
```

Response: Request created with auto-generated `requestId`

### Accepting Request (Donor)

```
PATCH /requests/{requestId}
{
  status: "accepted"
}

PATCH /listings/{listingId}
{
  status: "reserved"
}
```

## Deployment

### Option 1: Netlify (Recommended for Free Tier)

1. Push code to GitHub
2. Connect GitHub repository to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add environment variables in Netlify dashboard
6. Deploy!

### Option 2: Vercel

1. Push code to GitHub
2. Import project to Vercel
3. Set framework: Vite
4. Configure environment variables
5. Deploy!

## Troubleshooting

### Issue: "Firebase not connected"
- Check that all environment variables are set correctly
- Verify Firebase project ID matches the configuration
- Check internet connection

### Issue: "Collection not found"
- Ensure Firestore collections exist (they auto-create on first write)
- Check security rules are properly configured
- Verify collection names are lowercase: "users", "listings", "requests"

### Issue: Image upload fails
- Check Firebase Storage is enabled in project
- Verify storage bucket path is correct
- Ensure image file is less than 5MB
- Check browser console for detailed error message

### Issue: Listing not visible after creation
- Verify listing status is "available"
- Check donor ID matches current user ID
- Ensure listing document was created (check Firestore)

### Issue: Request not appearing for donor
- Check request document exists in Firestore
- Verify listing ID matches the donor's listing
- Confirm security rules allow donor to see their requests

## Testing Checklist

1. **Authentication**
   - [ ] Sign up as donor
   - [ ] Sign up as receiver
   - [ ] Login with existing account
   - [ ] Google Sign-In works
   - [ ] Sign out works

2. **Donor Features**
   - [ ] Can access `/create` page
   - [ ] Can upload image
   - [ ] Listing created with all fields
   - [ ] Can see listing in dashboard
   - [ ] Can view incoming requests
   - [ ] Can accept request
   - [ ] Can reject request

3. **Receiver Features**
   - [ ] Can see listings on home page
   - [ ] Can browse listings in `/dashboard/receiver`
   - [ ] Can filter by category
   - [ ] Can click to view listing details
   - [ ] Can request food
   - [ ] Can view requests in `/my-requests`
   - [ ] Can see request status updates

4. **Data Integrity**
   - [ ] Listing status changes to "reserved" after accept
   - [ ] Request status updates correctly
   - [ ] Images display properly
   - [ ] Location data saved and displayed

## Performance Tips

1. **Optimize Images**: Compress images before uploading
2. **Use Firestore Queries**: Already optimized with proper indexes
3. **Lazy Loading**: Images loaded lazily via `loading="lazy"`
4. **Pagination**: Consider adding pagination for many listings

## Free Tier Limits

Firebase Spark (Free) Plan includes:
- **Firestore**: 1GB storage, 50,000 reads/day, 20,000 writes/day
- **Storage**: 5GB total, 1GB/day download
- **Authentication**: Unlimited users

This is sufficient for a college project with moderate usage.

## Future Enhancements

1. Add map integration to show donation locations
2. Implement notifications (email/SMS on request status)
3. Add user ratings and reviews
4. Implement advanced filtering (distance, rating, etc.)
5. Add chat between donors and receivers
6. Analytics dashboard
7. Mobile app version

## Support & Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [React Router Documentation](https://reactrouter.com/)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)

## License

This project is created for educational purposes (college project).

---

**Last Updated**: 2024
**Status**: Production Ready
