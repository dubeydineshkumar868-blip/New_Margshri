# Marghee

Bike se bus tak — local aur long-distance dono ke liye ride/vehicle-pool sharing app.
Ab Firebase Firestore se connected hai, isliye data **real-time mein sabke beech sync** hota hai.

## Live check karne ke steps (GitHub + Vercel)

1. GitHub par naya repository banao (empty).
2. Is folder ke saare files usme upload karo ("Add file" -> "Upload files").
   - node_modules folder mat upload karna (wo hai hi nahi is zip mein).
3. https://vercel.com par jaake GitHub account se login karo.
4. "Add New Project" -> apni repository select karo -> "Deploy" dabao.
5. 1-2 minute mein live URL milega.

## Firebase

Ye app `src/firebase.js` mein diye gaye Firebase project se connected hai
("margshri-ef82b"). Data do collections mein store hota hai:
- `vehicles` - saare posted vehicles
- `requests` - saari ride requests

Firestore abhi "test mode" mein hai, matlab koi bhi read/write kar sakta hai.
Jab app real users ke liye ready ho, Firebase Console -> Firestore Database ->
Rules mein jaakar proper security rules lagani chahiye (login-based access).
