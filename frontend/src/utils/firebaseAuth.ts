// Firebase Authentication utility functions
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  fetchSignInMethodsForEmail,
  signOut,
  updatePassword
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../config/firebase';

/**
 * Creates a new user account with email and password
 * 
 * SECURITY NOTE:
 * - Passwords are automatically hashed by Firebase Authentication using secure one-way hashing (bcrypt)
 * - The hashed password is stored in Firebase Authentication, NOT in Firestore
 * - You cannot view the original password - it's cryptographically hashed
 * - Firebase Authentication handles all password security automatically
 * 
 * @param email - User's email address
 * @param password - User's password (will be securely hashed by Firebase)
 * @param displayName - User's display name
 */
export const signUpWithEmail = async (
  email: string, 
  password: string, 
  displayName: string
): Promise<{ user: User | null; error: string | null }> => {
  try {
    // Firebase Authentication automatically hashes the password securely
    // The password is never stored in plain text - it's hashed using bcrypt
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update the user's display name
    if (user && displayName) {
      await updateProfile(user, { displayName });
    }

    return { user, error: null };
  } catch (error: any) {
    let errorMessage = 'An error occurred during sign up';
    
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'This email address is already in use';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak';
    } else if (error.code) {
      errorMessage = error.message || errorMessage;
    }

    return { user: null, error: errorMessage };
  }
};

/**
 * Signs in an existing user with email and password
 */
export const signInWithEmail = async (
  email: string, 
  password: string
): Promise<{ user: User | null; error: string | null }> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    let errorMessage = 'An error occurred during sign in';
    
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email address';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect password';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    } else if (error.code === 'auth/user-disabled') {
      errorMessage = 'This account has been disabled';
    } else if (error.code) {
      errorMessage = error.message || errorMessage;
    }

    return { user: null, error: errorMessage };
  }
};

/**
 * Sends a password reset email (legacy function, kept for compatibility)
 */
export const resetPassword = async (email: string): Promise<{ success: boolean; error: string | null }> => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, error: null };
  } catch (error: any) {
    let errorMessage = 'An error occurred while sending the reset email';
    
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email address';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    } else if (error.code) {
      errorMessage = error.message || errorMessage;
    }

    return { success: false, error: errorMessage };
  }
};

/**
 * Sends password reset email with verification code
 * Note: In production, this would send an actual email via Cloud Functions
 * For development, the code is returned and should be displayed/logged
 */
export const sendPasswordResetWithCode = async (
  email: string
): Promise<{ success: boolean; code: string | null; error: string | null }> => {
  try {
    // Check if email exists
    const emailExists = await checkEmailExists(email);
    if (!emailExists) {
      return { success: false, code: null, error: 'No account found with this email address' };
    }
    
    // Generate verification code
    const { generateVerificationCode, saveVerificationCode } = await import('./firestore');
    const code = generateVerificationCode();
    
    // Save code to Firestore
    const { success, error } = await saveVerificationCode(email, code);
    if (!success) {
      return { success: false, code: null, error: error || 'Failed to save verification code' };
    }
    
    // Send the standard Firebase password reset email
    await sendPasswordResetEmail(auth, email);
    
    // In production, the code would be sent via email through Cloud Functions
    // For development, we return it so it can be displayed
    return { success: true, code, error: null };
  } catch (error: any) {
    let errorMessage = 'Failed to send password reset email';
    
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email address';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    } else if (error.code) {
      errorMessage = error.message || errorMessage;
    }
    
    return { success: false, code: null, error: errorMessage };
  }
};

/**
 * Updates password after verification code is confirmed
 * 
 * IMPORTANT: This requires a Cloud Function with Firebase Admin SDK to work properly.
 * The Cloud Function should:
 * 1. Listen to 'passwordResetRequests' collection
 * 2. Use admin.auth().updateUser() to update the password
 * 3. Delete the request document after processing
 * 
 * For now, this stores the request in Firestore and sends a backup reset email.
 */
export const resetPasswordAfterVerification = async (
  email: string,
  newPassword: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    // Store the password reset request in Firestore
    // A Cloud Function will process this using Admin SDK
    const { saveTemporaryPassword } = await import('./firestore');
    const { success, error } = await saveTemporaryPassword(email, newPassword);
    
    if (!success) {
      return { success: false, error: error || 'Failed to save password reset request' };
    }
    
    // NOTE: In production, you need a Cloud Function that:
    // exports.updatePassword = functions.firestore
    //   .document('passwordResetRequests/{email}')
    //   .onCreate(async (snap, context) => {
    //     const { email, newPassword } = snap.data();
    //     const user = await admin.auth().getUserByEmail(email);
    //     await admin.auth().updateUser(user.uid, { password: newPassword });
    //     await snap.ref.delete();
    //   });
    
    // For development/testing, we'll also send a password reset email as backup
    // In production, the Cloud Function should handle everything
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (emailError) {
      // Email sending is optional, don't fail if it errors
      console.warn('Failed to send backup reset email:', emailError);
    }
    
    return { 
      success: true, 
      error: null
    };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'Failed to reset password' 
    };
  }
};

/**
 * Checks if an email is already in use
 */
export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    // Check if email is already registered by fetching sign-in methods
    const methods = await fetchSignInMethodsForEmail(auth, email);
    return methods.length > 0;
  } catch (error) {
    // If there's an error, assume email doesn't exist
    return false;
  }
};

/**
 * Signs out the current user
 */
export const signOutUser = async (): Promise<{ success: boolean; error: string | null }> => {
  try {
    await signOut(auth);
    return { success: true, error: null };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'Failed to sign out' 
    };
  }
};

/**
 * Updates password for the current user
 */
export const updateUserPassword = async (
  newPassword: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'No user is currently signed in' };
    }
    
    await updatePassword(user, newPassword);
    return { success: true, error: null };
  } catch (error: any) {
    let errorMessage = 'Failed to update password';
    
    if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak';
    } else if (error.code === 'auth/requires-recent-login') {
      errorMessage = 'Please sign in again to change your password';
    } else if (error.code) {
      errorMessage = error.message || errorMessage;
    }
    
    return { success: false, error: errorMessage };
  }
};

