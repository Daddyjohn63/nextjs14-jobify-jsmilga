'use Server';
import prisma from './db';
import { auth } from '@clerk/nextjs';
import { JobType, CreateAndEditJobType, createAndEditJobSchema } from './types';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';
import dayjs from 'dayjs';

function authenticateAndRedirect(): string {
  const { userId } = auth();
  console.log('USER ID FROM CLERK', { userId });
  console.log('USER ID FROM CLERK', userId);
  if (!userId) {
    return redirect('/');
  }

  return userId;
}

export async function createJobAction(
  values: CreateAndEditJobType
): Promise<JobType | null> {
  console.log('Received values:', values); // Log the received values (confirmED I can see them)
  await new Promise(resolve => setTimeout(resolve, 3000));
  const userId = authenticateAndRedirect();
  try {
    createAndEditJobSchema.parse(values); //zod parse for server validation

    const job: JobType = await prisma.job.create({
      data: {
        ...values,

        clerkId: userId
      }
    });
    console.log('Job created:', job); // Log the created job (CANNOT SEE THIS LOGGED)
    return job;
  } catch (error) {
    console.error(error);
    return null;
  }
}
