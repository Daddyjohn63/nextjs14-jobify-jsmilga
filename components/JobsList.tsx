'use client';
import JobCard from './JobCard';
import { useSearchParams } from 'next/navigation';
import { getAllJobsAction } from '@/utils/actions';
import { useQuery } from '@tanstack/react-query';

function JobsList() {
  const searchParams = useSearchParams();

  //get the params from the url . These params were created in SearchForm.tsx
  const search = searchParams.get('search') || '';
  const jobStatus = searchParams.get('jobStatus') || 'all';

  const pageNumber = Number(searchParams.get('page')) || 1;

  const { data, isPending } = useQuery({
    //if any of the dynamic variables change (the params), then the new data will be fetched.
    queryKey: ['jobs', search, jobStatus, pageNumber],
    //the queryFn we pass in MUST return a promise.
    queryFn: () => getAllJobsAction({ search, jobStatus, page: pageNumber })
  });

  const jobs = data?.jobs || [];

  if (isPending) return <h2 className="text-xl">Please wait...</h2>;
  if (jobs.length < 1) return <h2 className="text-xl">No Jobs Found...</h2>;

  return (
    <>
      {/*button container  */}
      <div className="grid md:grid-cols-2  gap-8">
        {jobs.map(job => {
          return <JobCard key={job.id} job={job} />;
        })}
      </div>
    </>
  );
}

export default JobsList;
