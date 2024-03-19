'use client';
import JobCard from './JobCard';
import { useSearchParams } from 'next/navigation';
import { getAllJobsAction } from '@/utils/actions';
import { useQuery } from '@tanstack/react-query';
//import ButtonContainer from './ButtonContainer';
import ButtonContainer from './ComplexButtonContainer';
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

  const count = data?.count || [];
  const page = data?.page || 0;
  //onclick we can see the page number.
  console.log('PAGE:', page);
  const totalPages = data?.totalPages || 0;

  if (isPending) return <h2 className="text-xl">Please wait...</h2>;
  if (jobs.length < 1) return <h2 className="text-xl">No Jobs Found...</h2>;

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-semibold capitalize">{count} jobs found</h2>
        {totalPages < 2 ? null : (
          //pass in page from tanstack query
          <ButtonContainer currentPage={page} totalPages={totalPages} />
        )}
      </div>
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
