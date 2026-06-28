// scripts/setup-firebase.ts
import { initializeApp } from 'firebase/app'
import { 
    getAuth, 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyB0pPYdfdbl8MViEA-BWHLtMxDPRU22VRo",
  authDomain: "project-ce803549-3eb9-46a9-931.firebaseapp.com",
  projectId: "project-ce803549-3eb9-46a9-931",
  storageBucket: "project-ce803549-3eb9-46a9-931.firebasestorage.app",
  messagingSenderId: "272597182388",
  appId: "1:272597182388:web:d4fb7a2c66ad69100c34e1",
  measurementId: "G-3YLXE1G42Y"
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)

const users = [
    {
        username: 'Francis',
        email: 'francis@dti.gov.ph',
        password: '123456',
        role: 'admin'
    },
    {
        username: 'Jeydeee',
        email: 'jeydeee@dti.gov.ph',
        password: '123456',
        role: 'provincial-director'
    }
]

async function setupFirebase() {
    console.log('🚀 Setting up Firebase users...')
    console.log(`📋 Firebase Project: ${firebaseConfig.projectId}`)
    
    for (const user of users) {
        try {
            console.log(`\n📝 Creating user: ${user.username}`)
            
            try {
                // Create the user account
                const userCredential = await createUserWithEmailAndPassword(
                    auth,
                    user.email,
                    user.password
                )
                console.log(`✅ Created user: ${user.username} (UID: ${userCredential.user.uid})`)
                console.log(`   Role: ${user.role}`)
                
            } catch (createError: any) {
                if (createError.code === 'auth/email-already-in-use') {
                    console.log(`👤 User ${user.username} already exists`)
                    
                    // Try to sign in to verify
                    try {
                        const signInResult = await signInWithEmailAndPassword(
                            auth,
                            user.email,
                            user.password
                        )
                        console.log(`✅ Verified user: ${user.username} (UID: ${signInResult.user.uid})`)
                    } catch (signInError) {
                        console.log(`⚠️ User exists but password may be different`)
                    }
                } else {
                    console.error(`❌ Error creating ${user.username}:`, createError.code)
                }
            }
            
        } catch (error: any) {
            console.error(`❌ Error:`, error.message)
        }
    }
}

setupFirebase()
    .catch(console.error)
    .finally(() => process.exit(0))