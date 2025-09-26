import NextAuth from 'next-auth';
import { authOptions } from '../../../../lib/auth'; // <-- ROUTE'tan değil lib'ten
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };