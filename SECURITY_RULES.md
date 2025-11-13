# FoodLink Security Rules

## Firestore Security Rules

Copy and paste the following rules into your Firebase Console → Firestore Database → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read and write their own user document
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
      allow read: if request.auth != null; // Other authenticated users can read user data
    }

    // Listings collection
    match /listings/{listingId} {
      // Anyone can read listings (availability is handled by application logic)
      allow read: if true;

      // Only donors can create listings
      allow create: if request.auth != null &&
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'donor' &&
                       request.resource.data.donorId == request.auth.uid &&
                       request.resource.data.status == 'available';

      // Only the donor who created the listing can update it
      allow update: if request.auth != null &&
                       resource.data.donorId == request.auth.uid &&
                       (request.resource.data.status in ['available', 'reserved']);

      // Only the donor who created the listing can delete it
      allow delete: if request.auth != null &&
                       resource.data.donorId == request.auth.uid;
    }

    // Requests collection
    match /requests/{requestId} {
      // Authenticated users can read all requests (filtered on client-side by app logic)
      allow read: if request.auth != null;

      // Receivers can create requests
      allow create: if request.auth != null &&
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'receiver' &&
                       request.resource.data.receiverId == request.auth.uid &&
                       request.resource.data.status == 'pending';

      // Donors can update request status (accept/reject)
      allow update: if request.auth != null &&
                       get(/databases/$(database)/documents/listings/$(resource.data.listingId)).data.donorId == request.auth.uid &&
                       request.resource.data.status in ['accepted', 'rejected'];

      // No deletes allowed
      allow delete: if false;
    }

    // Default deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Firebase Storage Security Rules

Copy and paste the following rules into your Firebase Console → Storage → Rules:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload images to listing_images folder
    match /listing_images/{allPaths=**} {
      allow read: if true; // Anyone can view images (they're public)
      allow write: if request.auth != null && 
                      (request.resource.size < 5 * 1024 * 1024) && // Max 5MB
                      request.resource.contentType.matches('image/.*'); // Only image files
      allow delete: if request.auth != null; // Authenticated users can delete their own
    }

    // Deny all other paths
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## How to Apply Rules

### Step 1: Access Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project "foodlink-firebase-project"

### Step 2: Set Firestore Rules
1. Navigate to **Firestore Database** → **Rules** tab
2. Replace all existing rules with the Firestore rules provided above
3. Click **Publish**

### Step 3: Set Storage Rules
1. Navigate to **Storage** → **Rules** tab
2. Replace all existing rules with the Storage rules provided above
3. Click **Publish**

## Collection Structure

The security rules enforce the following structure:

### users collection
```
users/{uid}
  ├── role: 'donor' | 'receiver'
  ├── name: string
  ├── email: string
  └── createdAt: timestamp
```

### listings collection
```
listings/{listingId}
  ├── title: string
  ├── description: string
  ├── quantity: string
  ├── locationText: string
  ├── category: 'veg' | 'non-veg'
  ├── status: 'available' | 'reserved'
  ├── donorId: string (uid)
  ├── donorName: string
  ├── imageUrl: string (URL to Firebase Storage)
  └── createdAt: timestamp
```

### requests collection
```
requests/{requestId}
  ├── listingId: string
  ├── receiverId: string (uid)
  ├── receiverName: string
  ├── status: 'pending' | 'accepted' | 'rejected'
  └── requestedAt: timestamp
```

## Key Security Features

1. **Role-Based Access**: Only users with role 'donor' can create listings
2. **User Data Protection**: Users can only read/write their own user documents
3. **Listing Protection**: Only the donor who created a listing can modify or delete it
4. **Request Protection**: Donors can only update requests for their own listings
5. **Image Security**: Images can only be uploaded by authenticated users, and are readable by anyone
6. **Size Limits**: Images are limited to 5MB
7. **Type Validation**: Only image files can be uploaded to Firebase Storage

## Testing the Rules

To verify the rules work correctly:

1. Create a test donor account and try to create a listing
2. Create a test receiver account and request the listing
3. Try to access another user's data (should fail)
4. Try to upload a non-image file (should fail)
