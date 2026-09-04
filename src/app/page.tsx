import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function Home() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  
  if (userId) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}