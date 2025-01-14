import Link from "next/link"
import SiteNav from "../../components/SiteNav"
import { formatDistanceToNowStrict, parseISO } from "date-fns"
import { useQueryParam, NumberParam } from "next-query-params"
import { useRouter } from "next/router"
import { getLastSlash } from "../../libs/nance"
import { useProposalsQuery, useSpaceInfo } from "../../hooks/NanceHooks"
import { Proposal } from "../../models/NanceTypes"
import useTotalSupplyOfProject from "../../hooks/juicebox/TotalSupplyOfProject"
import { formatTokenBalance } from "../../libs/NumberFormatter"
import useSnapshotSpaceInfo from "../../hooks/snapshot/SpaceInfo"

export default function NanceProposals() {
    const router = useRouter();
    const { space } = router.query;
    const [cycle, setCycle] = useQueryParam<number>('cycle', NumberParam);
    const { data: infoData, isLoading: infoLoading, error: infoError} =  useSpaceInfo({ space: space as string }, router.isReady);
    const { data: proposalData, isLoading: proposalsLoading, error: proposalError }  = useProposalsQuery({ space: space as string, cycle }, router.isReady);
    const currentCycle = cycle || infoData?.data?.currentCycle;
    const noNextCycle = cycle && !infoLoading && infoData?.data?.currentCycle && cycle > infoData?.data?.currentCycle;

    let remainingTime = "-";
    try {
        remainingTime = formatDistanceToNowStrict(parseISO(infoData?.data?.currentEvent?.end));
    } catch (error) {
        console.warn("🔴 Nance.formatDistanceToNowStrict ->", error);
    }
    

  return (
    <>
      <SiteNav pageTitle="Current proposal on Nance" description="Display info of current proposals on Nance." image="/images/opengraph/nance_current_demo.png" />
      <div className="m-4 lg:m-6 flex justify-center lg:px-20">
        <div className="flex flex-col max-w-7xl w-full">

            {/* Page header */}
            <div className="max-w-7xl md:flex md:space-x-5">
                <div className="flex flex-col space-y-6 items-center md:flex-row md:justify-between md:space-x-6 w-full">
                    <div className="flex-shrink-0 md:w-5/12 flex space-x-3">
                        <img
                            className="h-16 w-16 rounded-full"
                            src={`https://cdn.stamp.fyi/space/jbdao.eth?s=160`}
                            alt="JuiceboxDAO Logo"
                        />

                        <div>
                            <h1 className="text-4xl font-bold text-gray-900">JuiceboxDAO</h1>
                            <p className="text-sm font-medium text-gray-500 text-right">powered by Nance</p>
                        </div>
                    </div>

                    <div className="md:w-5/12 flex space-x-4">
                        <SpaceStats />
                    </div>
                    
                    <div className="break-words p-2 md:w-2/12 text-center rounded-md border-2 border-indigo-600 bg-indigo-100">
                        <a className="text-2xl font-semibold text-gray-900"
                            href="https://info.juicebox.money/dao/process/" target="_blank" rel="noopener noreferrer">
                                {infoData?.data?.currentEvent?.title || "Unknown"} of GC{infoData?.data?.currentCycle}
                        </a>
                        <p className="text-sm font-medium text-gray-500">{remainingTime} remaining</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-end mt-6">
                <Link
                    href={{
                        pathname: `/nance/${space as string}/new`,
                        query: { type: 'Payout', version: 2, project: 1 },
                    }}
                >
                    <a
                        className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        New Proposal
                    </a>
                </Link>
            </div>

            <div className="mt-6 overflow-hidden bg-white shadow rounded-md">
                <ProposalCards loading={infoLoading || proposalsLoading} proposals={proposalData?.data} space={space as string} currentCycle={currentCycle} />
            </div>

            <div className="mt-6">
                <div className="flex flex-1 justify-end">
                    <button
                        disabled={cycle === 1}
                        onClick={() => setCycle(currentCycle - 1)}
                        className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                        Previous
                    </button>
                    {!noNextCycle && (
                        <button
                            onClick={() => setCycle(currentCycle + 1)}
                            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                            Next
                        </button>
                    )}
                </div>
            </div>

        </div>
      </div>
    </>
  )
}

function SpaceStats() {
    // JBX total supply across v1, v2 and v3
    const { value: v1Supply } = useTotalSupplyOfProject({ projectId: 1, version: 1 });
    const { value: v2Supply } = useTotalSupplyOfProject({ projectId: 1, version: 2 });
    const { value: v3Supply } = useTotalSupplyOfProject({ projectId: 1, version: 3 });
    // JuiceboxDAO Snapshot followers
    const { data: spaceInfo } = useSnapshotSpaceInfo('jbdao.eth');

    const totalSupply = v1Supply?.add(v2Supply ?? 0)?.add(v3Supply ?? 0);

    return (
        <>
            <div className="">
                <h1 className="text-sm font-semibold text-gray-900">Overview</h1>
                <div className="flex justify-between space-x-5">
                    <div>
                        <p className="text-xs text-gray-500">Voting Tokens</p>
                        <p className="text-xs text-gray-500">Elligible Addresses</p>
                        <p className="text-xs text-gray-500">Snapshot Followers</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 text-right">{totalSupply ? formatTokenBalance(totalSupply) : '-'}</p>
                        <p className="text-xs text-gray-500 text-right">-</p>
                        <p className="text-xs text-gray-500 text-right">{spaceInfo?.followersCount ?? '-'}</p>
                    </div>
                </div>
            </div>
            <div className="">
                <h1 className="text-sm font-semibold text-gray-900">Participation</h1>
                <div className="flex justify-between space-x-5">
                    <div>
                        <p className="text-xs text-gray-500">Proposals/Cycle</p>
                        <p className="text-xs text-gray-500">Voting Addresses</p>
                        <p className="text-xs text-gray-500">Voting/Total Supply</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 text-right">-</p>
                        <p className="text-xs text-gray-500 text-right">-</p>
                        <p className="text-xs text-gray-500 text-right">-</p>
                    </div>
                </div>
            </div>
        </>
    )
}

function ProposalCards({loading, proposals, space, currentCycle}: {loading: boolean, proposals: Proposal[], space: string, currentCycle: number}) {
    return (
        <>
            {loading && <p className="text-center m-2">loading...</p>}
            {!loading && proposals?.length === 0 && <p className="text-center m-2">No proposals found</p>}
            <ul role="list" className="divide-y divide-gray-200">
                {proposals?.map((proposal, index, arr) => (
                    <li key={proposal.hash}>
                        <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-center md:space-x-2 flex-col md:flex-row ">
                                <div className="flex flex-shrink-0 md:w-1/12">
                                    {(proposal.status === 'Discussion' || proposal.status === 'Draft' || proposal.status === 'Revoked') && (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                            {proposal.status}
                                        </span>
                                    )}
                                    {proposal.status === 'Approved' && (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            Approved
                                        </span>
                                    )}
                                    {proposal.status === 'Cancelled' && (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                            Cancelled
                                        </span>
                                    )}
                                    {(proposal.status !== 'Discussion' && proposal.status !== 'Approved' && proposal.status !== 'Cancelled' && proposal.status !== 'Draft' && proposal.status !== 'Revoked') && (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                            {proposal.status}
                                        </span>
                                    )}
                                </div>

                                <p className="md:w-1/12">
                                    {`GC${currentCycle}`}
                                </p>

                                <p className="md:w-1/12">
                                {`${(proposal.proposalId !== '') ? proposal.proposalId : '-'}`}
                                </p>

                                <Link href={proposal?.voteURL ? `/snapshot/jbdao.eth/proposal/${getLastSlash(proposal.voteURL)}` : `/nance/${space}/proposal/${proposal.hash}`}>
                                    <a className="break-words text-sm font-medium text-indigo-500 hover:underline md:w-1/2">
                                        {proposal.title}
                                    </a>
                                </Link>

                                {/* TODO: 1/6 Votes Stats */}
                                <div className="md:w-1/6">

                                </div>
                            
                                <p className="md:w-1/12 md:text-right">
                                    {proposal?.date && formatDistanceToNowStrict(new Date(proposal.date), { addSuffix: true })}
                                </p>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </>
    )
}