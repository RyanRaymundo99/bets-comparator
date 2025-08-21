// Mock authentication system for development testing
export interface MockUser {
  id: string;
  name: string;
  email: string;
  cpf: string;
  emailVerified: boolean;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
}

export class MockAuthClient {
  private static instance: MockAuthClient;
  private users: MockUser[] = [];
  private currentUser: MockUser | null = null;

  static getInstance(): MockAuthClient {
    if (!MockAuthClient.instance) {
      MockAuthClient.instance = new MockAuthClient();
    }
    return MockAuthClient.instance;
  }

  async signUp(data: {
    email: string;
    password: string;
    name: string;
    cpf: string;
  }): Promise<{ user: MockUser }> {
    // Check if user already exists
    const existingUser = this.users.find((u) => u.email === data.email);
    if (existingUser) {
      throw new Error("User already exists");
    }

    // Check if CPF already exists
    const existingCPF = this.users.find((u) => u.cpf === data.cpf);
    if (existingCPF) {
      throw new Error("CPF already registered");
    }

    const newUser: MockUser = {
      id: `user_${Date.now()}`,
      name: data.name,
      email: data.email,
      cpf: data.cpf,
      emailVerified: true, // Auto-verify since we removed email verification
      approvalStatus: "PENDING",
    };

    this.users.push(newUser);
    this.currentUser = newUser;

    console.log("Mock user created:", newUser);
    return { user: newUser };
  }

  async signIn(data: {
    email: string;
    password: string;
  }): Promise<{ user: MockUser }> {
    // Try to find user by email or CPF
    const user = this.users.find(
      (u) => u.email === data.email || u.cpf === data.email
    );

    if (!user) {
      throw new Error("User not found");
    }

    this.currentUser = user;
    console.log("Mock user signed in:", user);
    return { user };
  }

  async getSession(): Promise<{ user: MockUser } | null> {
    return this.currentUser ? { user: this.currentUser } : null;
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
    console.log("Mock user signed out");
  }

  async verifyEmail(token: string): Promise<void> {
    // Mock email verification
    console.log("Mock email verification with token:", token);
    if (this.currentUser) {
      this.currentUser.emailVerified = true;
    }
  }
}

export const mockAuthClient = MockAuthClient.getInstance();
