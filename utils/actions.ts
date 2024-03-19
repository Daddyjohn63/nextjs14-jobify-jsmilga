'use server';
import prisma from './db';
import { auth } from '@clerk/nextjs';
import { JobType, CreateAndEditJobType, createAndEditJobSchema } from './types';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';
import dayjs from 'dayjs';

function authenticateAndRedirect(): string {
  const { userId } = auth();
  //console.log('USER ID FROM CLERK', userId);
  if (!userId) {
    return redirect('/');
  }

  return userId;
}

export async function createJobAction(
  values: CreateAndEditJobType
): Promise<JobType | null> {
  //console.log('Received values:', values); // Log the received values (CONFIRMED, I can see the VALUES)
  await new Promise(resolve => setTimeout(resolve, 3000));
  const userId = authenticateAndRedirect();
  // if (userId) {
  //   console.log('Authentication successful');
  // }
  try {
    createAndEditJobSchema.parse(values); //zod parse for server validation

    const job: JobType = await prisma.job.create({
      data: {
        ...values,

        clerkId: userId
      }
    });
    //console.log('Job created:', job); // Log the created job (CANNOT SEE THIS LOGGED)
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
  page = 1, // this is the default
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

    const skip = (page - 1) * limit;

    const jobs: JobType[] = await prisma.job.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    });

    //count number of jobs in database
    const count: number = await prisma.job.count({
      where: whereClause
    });

    const totalPages = Math.ceil(count / limit);

    return { jobs, count, page, totalPages };
  } catch (error) {
    console.error(error);
    return { jobs: [], count: 0, page: 1, totalPages: 0 };
  }
}

export async function deleteJobAction(id: string): Promise<JobType | null> {
  const userId = authenticateAndRedirect();

  try {
    const job: JobType = await prisma.job.delete({
      where: {
        id,
        clerkId: userId //make sure the job belongs to the user.
      }
    });
    return job;
  } catch (error) {
    return null;
  }
}

export async function getSingleJobAction(id: string): Promise<JobType | null> {
  let job: JobType | null = null;
  const userId = authenticateAndRedirect();

  try {
    job = await prisma.job.findUnique({
      where: {
        id,
        clerkId: userId
      }
    });
  } catch (error) {
    job = null;
  }
  if (!job) {
    redirect('/jobs');
  }
  return job;
}

export async function updateJobAction(
  id: string,
  values: CreateAndEditJobType
): Promise<JobType | null> {
  const userId = authenticateAndRedirect();

  try {
    const job: JobType = await prisma.job.update({
      where: {
        id,
        clerkId: userId
      },
      data: {
        ...values
      }
    });
    return job;
  } catch (error) {
    return null;
  }
}

export async function getStatsAction(): Promise<{
  pending: number;
  interview: number;
  declined: number;
}> {
  // await new Promise(resolve => setTimeout(resolve, 5000));
  const userId = authenticateAndRedirect();

  try {
    const stats = await prisma.job.groupBy({
      where: {
        clerkId: userId
      },
      by: ['status'],
      _count: {
        status: true
      }
    });
    // console.log(stats);
    const statsObject = stats.reduce((acc, curr) => {
      acc[curr.status] = curr._count.status;
      return acc;
    }, {} as Record<string, number>);

    //console.log(statsObject);

    const defaultStats = {
      pending: 0,
      declined: 0,
      interview: 0,
      ...statsObject
    };
    return defaultStats;
  } catch (error) {
    redirect('/jobs');
  }
}

export async function getChartsDataAction(): Promise<
  Array<{ date: string; count: number }>
> {
  const userId = authenticateAndRedirect();
  const sixMonthsAgo = dayjs().subtract(6, 'month').toDate();
  try {
    const jobs = await prisma.job.findMany({
      where: {
        clerkId: userId,
        createdAt: {
          gte: sixMonthsAgo
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(jobs);

    let applicationsPerMonth = jobs.reduce((acc, job) => {
      const date = dayjs(job.createdAt).format('MMM YY');

      const existingEntry = acc.find(entry => entry.date === date);

      if (existingEntry) {
        existingEntry.count += 1;
      } else {
        acc.push({ date, count: 1 }); //return an object array in the format needed for the chart.
      }

      return acc;
    }, [] as Array<{ date: string; count: number }>);

    return applicationsPerMonth;
  } catch (error) {
    redirect('/jobs');
  }
}
