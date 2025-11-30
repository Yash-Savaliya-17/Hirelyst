import { useState } from 'react';
import { CheckCircle, FileText, UploadIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Common/shadcnui/card';
import { Button } from '@/components/Common/shadcnui/button';
import { Alert, AlertDescription } from '@/components/Common/shadcnui/alert';
import { Input } from '@/components/Common/shadcnui/input';
import { Progress } from '@/components/Common/shadcnui/progress';
import { Separator } from '@/components/Common/shadcnui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/Common/shadcnui/tabs';
import { resumeATSscore } from '@/services/operations/ResumeOperations';
import SelectionAnalysis from './SelectionAnalysis';
import {
    TrendingUp,
    Target,
    BarChart2,
} from 'lucide-react';



interface resumeATSscore {
    ats_score: number,
    format_score: number,
    keyword_score: number,
    section_scores: number,
    keyword_matches: [],
    missing_keywords: [],
    formatting_issues: [],
    action_verbs_missing: [],
    section_analysis: []
}


const ResumeScore = () => {
    const [file, setFile] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [jobDescription, setJobDescription] = useState('');
    const [atsScore, setAtsScore] = useState<resumeATSscore>();

    // Handle file selection
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        setFile(selectedFile);
    };

    const handleJobDescriptionChange = (e: any) => {
        setJobDescription(e.target.value);
    };

    const handleCheckATS = async () => {
        if (!file || !jobDescription)
            return;

        setLoading(true);
        const formData = new FormData();
        formData.append("resume", file);
        formData.append("job_description", jobDescription);

        try {
            const response = await resumeATSscore(formData);
            setAtsScore(response.data.analysis);
            console.log(response)
            setLoading(false);
        } catch (error) {
            setLoading(false);
            console.error('Error:', error);
        } finally {
            setLoading(false);

        }
    }

   

    const renderProgressBar = (value: number) => (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
                className={`h-2.5 rounded-full transition-all duration-500 ease-in-out bg-blue-300
                    }`}
                style={{ width: `${value}%` }}
            ></div>
        </div>
    );

    return (
        <div className="font-manrope mx-auto p-4">
            <div className="gap-6">
                {
                    atsScore ?
                        (
                            <>
                                <Card className="w-full border-none">
                                    <CardHeader className="bg-[#e5f1ff] border-b border-[#c3deff] p-6">
                                        <CardTitle className="text-2xl font-bold text-[#4a516d]">Overall
                                            Scores</CardTitle>
                                    </CardHeader>
                                    <div className='p-4 space-y-6'>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {[
                                                {
                                                    icon: TrendingUp,
                                                    title: 'Overall ATS Score',
                                                    value: atsScore.ats_score
                                                },
                                                {
                                                    icon: FileText,
                                                    title: 'Format Score',
                                                    value: atsScore.format_score
                                                },
                                                {
                                                    icon: Target,
                                                    title: 'Keyword Match Score',
                                                    value: atsScore.keyword_score
                                                }
                                            ].map(({ icon: Icon, title, value }) => (
                                                <div key={title} className="space-y-2">
                                                    <div className="flex items-center text-gray-600">
                                                        <Icon className="mr-2" size={20} />
                                                        <h3 className="font-medium text-sm">{title}</h3>
                                                    </div>
                                                    {renderProgressBar(value)}
                                                    <p className={`text-xl font-bold`}>
                                                        {value}/100
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="space-y-4 p-4">
                                            <div className="flex items-center text-gray-800">
                                                <BarChart2 className="mr-2" size={24} />
                                                <h2 className="text-xl font-bold">Section Performance</h2>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                                {Object.entries(atsScore.section_scores).map(([key, value]) => (
                                                    <div key={key} className="space-y-2">
                                                        <div className="flex items-center">
                                                            <CheckCircle
                                                                className={`mr-2 text-blue-400 }`}
                                                                size={16}
                                                            />
                                                            <h3 className="text-sm font-medium capitalize">
                                                                {key.replace('_', ' ')}
                                                            </h3>
                                                        </div>
                                                        {renderProgressBar(value)}
                                                        <p className={`text-sm font-bold`}>
                                                            {value}/100
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <Separator />
                                    </div>

                                    <div className='space-y-6 p-4'>
                                        <h2 className="text-xl font-bold mb-2 text-[#4a516d]">Detailed Feedback</h2>
                                        <Tabs defaultValue={Object.keys(atsScore.section_analysis)[0]} className="w-full">
                                            <TabsList className="grid w-full grid-cols-7">
                                                {Object.entries(atsScore.section_analysis).map(([key]) => (
                                                    <TabsTrigger key={key} value={key}>
                                                        {key.charAt(0).toUpperCase() + key.slice(1)}
                                                    </TabsTrigger>
                                                ))}
                                            </TabsList>
                                            {Object.entries(atsScore.section_analysis).map(([key, value]: any) => (
                                                <TabsContent key={key} value={key}>
                                                    <SelectionAnalysis selectionanalysis={atsScore.section_analysis[key]} />
                                                </TabsContent>
                                            ))}
                                        </Tabs>

                                    </div>
                                    <div className='flex flex-col p-4  space-y-6'>
                                        <h1 className='text-xl font-bold mb-2 text-[#4a516d]'>Keyword Analysis</h1>
                                        <div className='flex justify-between'>
                                            <div className='w-1/2'>
                                                <h1 className='text-lg font-bold'>Found keywords</h1>
                                                {atsScore.keyword_matches && Object.keys(atsScore.keyword_matches).length > 0 ? (
                                                    Object.entries(atsScore.keyword_matches).map(([key, value]: any) => (
                                                        <div key={key} className='flex flex-col space-y-1 mt-1'>
                                                            <h1 className='text-md font-bold'>{value}</h1>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className='flex flex-col space-y-1 mt-5'>
                                                        No matching keywords found
                                                    </div>
                                                )}
                                            </div>
                                            <div className='w-1/2'>
                                                <h1 className='text-lg font-bold'>Missing keywords</h1>
                                                {atsScore.missing_keywords && Object.keys(atsScore.missing_keywords).length > 0 ? (
                                                    Object.entries(atsScore.missing_keywords).map(([key, value]: any) => (
                                                        <div key={key} className='flex flex-col space-y-1 mt-1'>
                                                            <h1 className='text-md font-bold'>{value}</h1>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className='flex flex-col space-y-1 mt-5'>
                                                        No missing keywords found
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <Separator />
                                        <div className='flex flex-col space-y-1'>
                                            <h1 className='text-xl font-bold mb-2 text-[#4a516d]'>Recommended Action
                                                Verbs</h1>
                                            <p className='text-sm font-semibold'>Consider using these powerfull action
                                                verbs:</p>
                                            {
                                                atsScore.action_verbs_missing && atsScore.action_verbs_missing.length > 0 ? (
                                                    <div className='flex space-x-1 mt-5'>
                                                        {atsScore.action_verbs_missing.map((verb: string) => (
                                                            <div key={verb} className='flex space-x-1 mt-1'>
                                                                <h1 className='text-md font-bold'>{verb}</h1>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className='flex flex-col space-y-1 mt-5'>
                                                        No action verbs missing
                                                    </div>
                                                )
                                            }
                                        </div>
                                        <Separator />
                                        <div className='flex w-full flex-col space-y-1'>
                                            <h1 className='text-xl font-bold mb-2 text-[#4a516d]'>Formatting issues</h1>
                                            <p className='text-sm'>Use bullet points consistently throughtout the exeperience section.</p>
                                            {
                                                atsScore.formatting_issues && atsScore.formatting_issues.length > 0 ? (
                                                    <div className='w-full mt-5'>
                                                        {atsScore.formatting_issues.map((verb: string) => (
                                                            <div key={verb} className='flex  mt-1'>
                                                                <h1 className='text-md font-bold'>-- {verb}</h1>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className='flex flex-col space-y-1 mt-5'>
                                                        No action verbs missing
                                                    </div>
                                                )
                                            }
                                        </div>
                                        <Separator />
                                        <div className='flex flex-col space-y-1'>
                                            <Button className='w-[30%]'>Dowmload detailed analysis report</Button>
                                        </div>
                                    </div>
                                </Card>
                            </>
                        ) :
                        (
                            <Card className="w-full h-full">
                                <CardHeader className="text-center">
                                    <CardTitle className="text-2xl font-bold mb-2">Resume ATS Score</CardTitle>
                                    <CardDescription className="text-lg">
                                        Check how well your resume performs against Applicant Tracking Systems (ATS)
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="space-y-6">
                                    <Alert className="bg-blue-50">
                                        <AlertDescription className="text-sm">
                                            <span className="font-semibold">Why it matters:</span> Over 75% of companies use
                                            ATS to screen resumes.
                                            A well-optimized resume increases your chances of getting past automated systems
                                            and into human hands.
                                        </AlertDescription>
                                    </Alert>

                                    <div
                                        className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center space-y-4">
                                        <div className="flex justify-center">
                                            <FileText className="h-12 w-12 text-gray-400" />
                                        </div>
                                        <div>
                                            <label htmlFor="resume-upload">
                                                <Input
                                                    type="file"
                                                    id="resume"
                                                    className="hidden"
                                                    accept=".pdf,.doc,.docx"
                                                    onChange={handleFileChange}
                                                />
                                                <Button
                                                    className="border-[0.5px] font-semibold p-6 w-42 rounded-md border-[#c3deff] hover:bg-[#e5f1ff] bg-[#f6faff] text-[#4a516d]"
                                                    onClick={() => document.getElementById('resume')?.click()}
                                                    disabled={loading}
                                                >
                                                    {loading ? 'Uploading...' : (
                                                        <>
                                                            <UploadIcon className="w-4 h-4 md:w-5 md:h-5 mr-2" /> Upload
                                                            Resume
                                                        </>
                                                    )}
                                                </Button>
                                            </label>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            Supports PDF, DOC, DOCX (Max 5MB)
                                        </p>
                                        {file && (
                                            <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                                                <CheckCircle className="w-4 h-4" />
                                                {file.name}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="job-description" className="block font-medium mb-2">
                                                Job Description
                                            </label>
                                            <textarea
                                                id="job-description"
                                                rows={3}
                                                placeholder="Paste the job description here"
                                                value={jobDescription}
                                                onChange={handleJobDescriptionChange}
                                                className="w-full font-manrope text-black placeholder:text-gray-500 rounded-lg border border-gray-200 text-sm pl-3 sm:pl-5 py-2 sm:py-3 focus:outline-none focus:ring-1 focus:ring-blue-800"
                                            />
                                        </div>
                                        <div className="text-center">
                                            <Button
                                                onClick={handleCheckATS}
                                                disabled={!file || !jobDescription || loading}
                                                className="w-full max-w-xs"
                                            >
                                                {loading ? 'Analyzing...' : 'Check ATS Score'}
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                }
            </div>
        </div>
    );
};

export default ResumeScore;


