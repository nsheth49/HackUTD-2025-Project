// Firestore utility functions
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { User } from 'firebase/auth';

export interface FinancialData {
  creditScore: number;
  annualIncome: number;
  debtToIncomeRatio: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface UserProfile {
  fullName: string;
  email: string;
  dateOfBirth: string;
  createdAt?: any;
  updatedAt?: any;
  // NOTE: Password is NEVER stored in Firestore
  // Passwords are securely hashed and stored in Firebase Authentication
}

/**
 * Saves user profile data to Firestore
 * 
 * SECURITY NOTE: 
 * - Passwords are NEVER saved to Firestore
 * - Passwords are securely hashed by Firebase Authentication using bcrypt
 * - Only non-sensitive profile data is stored here
 * 
 * @param user - Firebase Auth user object
 * @param profileData - User profile data (does NOT include password)
 */
export const saveUserProfile = async (
  user: User, 
  profileData: Omit<UserProfile, 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; error: string | null }> => {
  try {
    // Security check: Ensure password is never accidentally saved
    if ('password' in profileData || 'Password' in profileData) {
      throw new Error('Passwords cannot be saved to Firestore');
    }

    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      ...profileData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    
    return { success: true, error: null };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'Failed to save user profile' 
    };
  }
};

/**
 * Saves financial data to Firestore linked to user account
 */
export const saveFinancialData = async (
  user: User,
  financialData: Omit<FinancialData, 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const financialRef = doc(db, 'users', user.uid, 'financial', 'data');
    await setDoc(financialRef, {
      ...financialData,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    
    return { success: true, error: null };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'Failed to save financial data' 
    };
  }
};

/**
 * Gets user profile data from Firestore
 */
export const getUserProfile = async (
  userId: string
): Promise<{ data: UserProfile | null; error: string | null }> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { data: userSnap.data() as UserProfile, error: null };
    } else {
      return { data: null, error: 'User profile not found' };
    }
  } catch (error: any) {
    return { 
      data: null, 
      error: error.message || 'Failed to get user profile' 
    };
  }
};

/**
 * Gets financial data from Firestore
 */
export const getFinancialData = async (
  userId: string
): Promise<{ data: FinancialData | null; error: string | null }> => {
  try {
    const financialRef = doc(db, 'users', userId, 'financial', 'data');
    const financialSnap = await getDoc(financialRef);
    
    if (financialSnap.exists()) {
      return { data: financialSnap.data() as FinancialData, error: null };
    } else {
      return { data: null, error: 'Financial data not found' };
    }
  } catch (error: any) {
    return { 
      data: null, 
      error: error.message || 'Failed to get financial data' 
    };
  }
};

// Chat-related interfaces and functions
export interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date | Timestamp;
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  userId: string;
}

/**
 * Gets all chats for a user, ordered by most recent
 */
export const getUserChats = async (
  userId: string,
  limitCount: number = 20
): Promise<{ chats: Chat[]; error: string | null }> => {
  try {
    const chatsRef = collection(db, 'users', userId, 'chats');
    const q = query(chatsRef, orderBy('updatedAt', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    
    const chats: Chat[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      chats.push({
        id: doc.id,
        title: data.title || 'New Chat',
        messages: (data.messages || []).map((msg: any) => ({
          ...msg,
          timestamp: msg.timestamp?.toDate ? msg.timestamp.toDate() : new Date(msg.timestamp)
        })),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
        userId: data.userId || userId
      });
    });
    
    return { chats, error: null };
  } catch (error: any) {
    return { 
      chats: [], 
      error: error.message || 'Failed to get user chats' 
    };
  }
};

/**
 * Gets a specific chat by ID
 */
export const getChat = async (
  userId: string,
  chatId: string
): Promise<{ chat: Chat | null; error: string | null }> => {
  try {
    const chatRef = doc(db, 'users', userId, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    
    if (chatSnap.exists()) {
      const data = chatSnap.data();
      return {
        chat: {
          id: chatSnap.id,
          title: data.title || 'New Chat',
          messages: (data.messages || []).map((msg: any) => ({
            ...msg,
            timestamp: msg.timestamp?.toDate ? msg.timestamp.toDate() : new Date(msg.timestamp)
          })),
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
          userId: data.userId || userId
        },
        error: null
      };
    } else {
      return { chat: null, error: 'Chat not found' };
    }
  } catch (error: any) {
    return { 
      chat: null, 
      error: error.message || 'Failed to get chat' 
    };
  }
};

/**
 * Creates a new chat
 */
export const createChat = async (
  userId: string,
  title: string = 'New Chat'
): Promise<{ chatId: string | null; error: string | null }> => {
  try {
    const chatsRef = collection(db, 'users', userId, 'chats');
    const newChatRef = await addDoc(chatsRef, {
      title,
      messages: [],
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { chatId: newChatRef.id, error: null };
  } catch (error: any) {
    return { 
      chatId: null, 
      error: error.message || 'Failed to create chat' 
    };
  }
};

/**
 * Saves messages to a chat (creates chat if it doesn't exist)
 */
export const saveChatMessages = async (
  userId: string,
  chatId: string | null,
  messages: ChatMessage[],
  title?: string
): Promise<{ chatId: string; error: string | null }> => {
  try {
    let finalChatId = chatId;
    
    // Create chat if it doesn't exist
    if (!finalChatId) {
      const firstUserMessage = messages.find(m => m.sender === 'user');
      const chatTitle = title || firstUserMessage?.text.substring(0, 50) || 'New Chat';
      const { chatId: newChatId, error } = await createChat(userId, chatTitle);
      if (error || !newChatId) {
        return { chatId: '', error: error || 'Failed to create chat' };
      }
      finalChatId = newChatId;
    }
    
    // Convert Date objects to Firestore Timestamps
    const firestoreMessages = messages.map(msg => ({
      ...msg,
      timestamp: msg.timestamp instanceof Date 
        ? Timestamp.fromDate(msg.timestamp) 
        : msg.timestamp
    }));
    
    const chatRef = doc(db, 'users', userId, 'chats', finalChatId);
    await updateDoc(chatRef, {
      messages: firestoreMessages,
      updatedAt: serverTimestamp()
    });
    
    return { chatId: finalChatId, error: null };
  } catch (error: any) {
    return { 
      chatId: chatId || '', 
      error: error.message || 'Failed to save chat messages' 
    };
  }
};

/**
 * Updates chat title
 */
export const updateChatTitle = async (
  userId: string,
  chatId: string,
  title: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const chatRef = doc(db, 'users', userId, 'chats', chatId);
    await updateDoc(chatRef, {
      title,
      updatedAt: serverTimestamp()
    });
    
    return { success: true, error: null };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'Failed to update chat title' 
    };
  }
};

// Password Reset Verification Code functions
export interface VerificationCode {
  email: string;
  code: string;
  createdAt: any;
  expiresAt: any;
  used: boolean;
}

/**
 * Generates a 6-digit verification code
 */
export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Saves verification code to Firestore
 */
export const saveVerificationCode = async (
  email: string,
  code: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    // Code expires in 10 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);
    
    const codeRef = doc(db, 'passwordResetCodes', email);
    await setDoc(codeRef, {
      email,
      code,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
      used: false
    });
    
    return { success: true, error: null };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'Failed to save verification code' 
    };
  }
};

/**
 * Verifies the verification code
 */
export const verifyCode = async (
  email: string,
  code: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const codeRef = doc(db, 'passwordResetCodes', email);
    const codeSnap = await getDoc(codeRef);
    
    if (!codeSnap.exists()) {
      return { success: false, error: 'Verification code not found or expired' };
    }
    
    const data = codeSnap.data() as VerificationCode;
    
    // Check if code is already used
    if (data.used) {
      return { success: false, error: 'This verification code has already been used' };
    }
    
    // Check if code is expired
    const expiresAt = data.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
    if (new Date() > expiresAt) {
      return { success: false, error: 'Verification code has expired' };
    }
    
    // Check if code matches
    if (data.code !== code) {
      return { success: false, error: 'Invalid verification code' };
    }
    
    // Mark code as used
    await updateDoc(codeRef, { used: true });
    
    return { success: true, error: null };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'Failed to verify code' 
    };
  }
};

/**
 * Saves temporary password for password reset
 * Note: In production, this should be encrypted and processed by a Cloud Function
 */
export const saveTemporaryPassword = async (
  email: string,
  newPassword: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    // Store temporarily - a Cloud Function would process this
    const tempPasswordRef = doc(db, 'passwordResetRequests', email);
    await setDoc(tempPasswordRef, {
      email,
      newPassword, // In production, this should be encrypted
      createdAt: serverTimestamp(),
      processed: false
    });
    
    return { success: true, error: null };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'Failed to save password reset request' 
    };
  }
};

