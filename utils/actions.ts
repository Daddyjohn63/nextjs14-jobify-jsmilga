'use server';
import prisma from './db';
import { auth } from '@clerk/nextjs';
import { JobType, CreateAndEditJobType, createAndEditJobSchema } from './types';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';
import dayjs from 'dayjs';

function authenticateAndRedirect(): string {
  const { userId } = auth();
  console.log('USER ID FROM CLERK', userId);
  if (!userId) {
    return redirect('/');
  }

  return userId;
}

export async function createJobAction(
  values: CreateAndEditJobType
): Promise<JobType | null> {
  console.log('Received values:', values); // Log the received values (CONFIRMED, I can see the VALUES)
  await new Promise(resolve => setTimeout(resolve, 3000));
  const userId = authenticateAndRedirect();
  if (userId) {
    console.log('Authentication successful');
  }
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

//get all job types

type GetAllJobsActionTypes = {
  search?: string;
  jobStatus?: string;
  page?: number;
  limit?: number;
};

export async function getAllJobsAction({
  search,
  jobStatus,
  page = 1,
  limit = 10
}: GetAllJobsActionTypes): Promise<{
  jobs: JobType[];
  count: number;
  page: number;
  totalPages: number;
}> {
  const userId = authenticateAndRedirect();

  try {
    let whereClause: Prisma.JobWhereInput = {
      clerkId: userId
    };
    if (search) {
      whereClause = {
        ...whereClause,
        OR: [
          {
            position: {
              contains: search
            }
          },
          {
            company: {
              contains: search
            }
          }
        ]
      };
    }
    if (jobStatus && jobStatus !== 'all') {
      whereClause = {
        ...whereClause,
        status: jobStatus
      };
    }

    const jobs: JobType[] = await prisma.job.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    });

    return { jobs, count: 0, page: 1, totalPages: 0 };
  } catch (error) {
    console.error(error);
    return { jobs: [], count: 0, page: 1, totalPages: 0 };
  }
}
