import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/Common/shadcnui/card"
import { Badge } from "@/components/Common/shadcnui/badge"
import { Button } from "@/components/Common/shadcnui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/Common/shadcnui/tooltip"
import { BarChart2, Calendar, Clock, Cog, Eye, FileQuestion, Radio, Trophy, Users } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { RootState } from "@/slices/store.ts"
import { useSelector } from "react-redux"

interface ExamQuizCardProps {
    title: string
    subject: string
    duration: number
    userRank: number
    totalParticipants: number
    score?: number
    totalQuestions: number
    attended: boolean
    attendedAt?: string | null
    createdAt?: string
    quizId: number
    startsAt: string
    endsAt: string
    quizStatus: 'active' | 'missed' | 'upcoming' | 'ended'
    createdById: number
}

const ExamQuizCard = ({
    quizId,
    title,
    subject,
    duration,
    userRank,
    totalParticipants,
    score,
    totalQuestions,
    attended,
    attendedAt,
    startsAt,
    endsAt,
    quizStatus,
    createdById
}: ExamQuizCardProps) => {
    const user = useSelector((state: RootState) => state.auth.user)
    const navigate = useNavigate()

    const getStatusColor = (status: string) => {
        if (status === 'ended' && !attended)
            status = 'missed'
        switch (status) {
            case 'active':
                return 'bg-emerald-500'
            case 'missed':
                return 'bg-red-500'
            case 'ended':
                return 'bg-sky-500'
            case 'upcoming':
                return 'bg-amber-500'
            default:
                return 'bg-slate-500'
        }
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Not available'
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getButtonConfig = (status: string, attended: boolean) => {
        if (status === 'active') {
            return {
                text: attended ? 'Attempted' : 'Join Quiz',
                variant: 'default',
                disabled: attended
            }
        }
        if (status === 'ended' && !attended)
            status = 'missed'
        switch (status) {
            case 'ended':
                return { text: 'View Results', variant: 'secondary', disabled: false }
            case 'missed':
                return { text: 'Quiz Expired', variant: 'destructive', disabled: true }
            case 'upcoming':
                return { text: 'Not Started Yet', variant: 'secondary', disabled: true }
            default:
                return { text: 'Join Quiz', variant: 'default', disabled: true }
        }
    }

    const buttonConfig = getButtonConfig(quizStatus, attended)

    return (
        <TooltipProvider>
            <Card
                className="w-full font-dm-sans max-w-md overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
                <div className={`h-1 ${getStatusColor(quizStatus)}`} />
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <CardTitle className="text-2xl font-bold mb-1">{title}</CardTitle>
                            <div className="flex flex-col gap-1">
                                <p className="text-sm text-muted-foreground">{subject}</p>
                                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        Starts: {formatDate(startsAt)}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        Ends: {formatDate(endsAt)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <Badge
                                className={`${getStatusColor(quizStatus)} text-white uppercase text-xs tracking-wider font-medium px-3 py-1 mt-1 rounded-full`}>
                                {
                                    (() => {
                                        if (quizStatus === 'active')
                                            return attended ? 'Attempted' : 'Live'
                                        if (quizStatus === 'upcoming')
                                            return 'Upcoming'
                                        if (quizStatus === 'ended')
                                            return attended ? 'Attempted' : 'Missed'
                                    })()
                                }
                            </Badge>
                            {user?.sys_id === createdById && (
                                <Link
                                    to={`/quiz/${quizId}/manage`}
                                    className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-gray-100 transition-colors duration-200"
                                >
                                    <Cog className="h-5 w-5 text-gray-600 hover:text-gray-900 transition-colors duration-200" />
                                </Link>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pb-4 font-dm-sans">
                    <div className="grid grid-cols-2 gap-4 mb-2">
                        <Tooltip>
                            <TooltipTrigger>
                                <div
                                    className="flex items-center p-2 rounded-lg border hover:bg-primary/20 transition-colors duration-200">
                                    <Clock className="mr-3 h-6 w-6 text-primary" />
                                    <div className="text-left">
                                        <p className="text-sm font-medium">{duration} min</p>
                                        <p className="text-xs text-muted-foreground">Duration</p>
                                    </div>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Total quiz duration</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger>
                                <div
                                    className="flex items-center p-2 rounded-lg border hover:bg-primary/20 transition-colors duration-200">
                                    <FileQuestion className="mr-3 h-6 w-6 text-primary" />
                                    <div className="text-left">
                                        <p className="text-sm font-medium">{totalQuestions}</p>
                                        <p className="text-xs text-muted-foreground">Questions</p>
                                    </div>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Total number of questions</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger>
                                <div
                                    className="flex items-center p-2 rounded-lg border hover:bg-primary/20 transition-colors duration-200">
                                    <Users className="mr-3 h-6 w-6 text-primary" />
                                    <div className="text-left">
                                        <p className="text-sm font-medium">
                                            {quizStatus === 'active' ? totalParticipants : (userRank > 0 ? `${userRank} / ` : '') + totalParticipants}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Participants</p>
                                    </div>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{quizStatus === 'active' ? 'Total participants' : (userRank > 0 ? 'Your rank / Total participants' : 'Total participants')}</p>
                            </TooltipContent>
                        </Tooltip>
                        {/* {
                            score ? (
                                <> */}
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <div
                                                className="flex items-center p-2 rounded-lg border  hover:bg-primary/20 transition-colors duration-200">
                                                {quizStatus === 'active' && !attended ? (
                                                    <Radio className="mr-3 h-6 w-6 text-primary" />
                                                ) : (
                                                    <BarChart2 className="mr-3 h-6 w-6 text-primary" />
                                                )}
                                                <div className="text-left">
                                                    <p className="text-sm font-medium">
                                                        {quizStatus === 'active' && !attended ? 'Live' :
                                                            quizStatus === 'ended' ? `${score}/${totalQuestions}` : 'N/A'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {quizStatus === 'active' && !attended ? 'Status' : 'Score'}
                                                    </p>
                                                </div>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{quizStatus === 'active' && !attended ? 'Quiz is live' : 'Your quiz score'}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                {/* </>
                            ) :
                                null
                        } */}

                    </div>
                    {attendedAt && quizStatus === 'ended' && (
                        <div className="mt-2 text-xs text-muted-foreground">
                            Completed on: {formatDate(attendedAt)}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    {buttonConfig.text !== "Join Quiz" && (
                        <Button
                            className="w-[50%]"
                            variant="outline"
                            onClick={() => navigate(`/quiz/${quizId}/leaderboard`)}
                        >
                            <Trophy className="mr-2 h-4 w-4" />
                            Leaderboard
                        </Button>
                    )}
                    <Button
                        className="w-[50%]"
                        variant={buttonConfig.variant as any}
                        onClick={() => {
                            if (buttonConfig.text === "Join Quiz") navigate(`/mcq/${quizId}`)
                            else if (buttonConfig.text === "View Results")
                                navigate(`/quiz/${quizId}/report`)
                        }}
                        disabled={buttonConfig.disabled}
                    >
                        <Eye className="mr-2 h-4 w-4" />
                        {buttonConfig.text}
                    </Button>
                </CardFooter>
            </Card>
        </TooltipProvider>
    )
}

export default ExamQuizCard
