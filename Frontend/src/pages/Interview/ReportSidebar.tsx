import React, {useState} from 'react'
import {BarChart2, MessageCircle} from 'lucide-react'
import AccordionSection from './AccordionSection'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/Common/shadcnui/card'
import {Tabs, TabsList, TabsTrigger} from '@/components/Common/shadcnui/tabs'
import {GoDotFill} from 'react-icons/go'


const ReportSidebar = ({ toggleActive, toggleToWeaknessHandler, toggleToImprovementHandler, selectedAnalysis }: any) => {

    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const handleToggle = (index: number) => {
        setOpenIndex(prev => (prev === index ? null : index));
    };

    return (
        <div>
            <Card className="h-full">
                <CardHeader className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-t-lg">
                    <CardTitle className="text-2xl font-bold">Your Speaking Insights</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <Tabs defaultValue="weakness" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="weakness" onClick={toggleToWeaknessHandler}>
                                <MessageCircle className="mr-2 h-4 w-4" />
                                Weakness
                            </TabsTrigger>
                            <TabsTrigger value="improvement" onClick={toggleToImprovementHandler}>
                                <BarChart2 className="mr-2 h-4 w-4" />
                                Improvement
                            </TabsTrigger>
                        </TabsList>

                        <div className="h-[calc(90vh-240px)] overflow-y-auto p-2">
                            {selectedAnalysis && (
                                <div className="space-y-4">
                                    {toggleActive === 'Improvement' ? (
                                        <>
                                            <h1 className="text-lg mt-2 mb-2 font-manrope font-semibold">Your Improvement</h1>
                                            <Card>
                                                <CardContent className="p-4">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-700 font-medium">Overall Score</span>
                                                        <span className="text-blue-600 font-semibold">
                                                            {(selectedAnalysis.overallScore * 100).toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                            <AccordionSection
                                                title="Clarity Explanation"
                                                content={<p className="text-center font-semibold text-gray-700 mb-2">Clarity measures how well your response matches the expected answer.</p>}
                                                openIndex={openIndex}
                                                index={1}
                                                score={(selectedAnalysis.clarityScore).toFixed(1)}
                                                handleToggle={handleToggle}
                                            />
                                            <AccordionSection
                                                title="Rating"
                                                content={<p className="text-center font-semibold text-gray-700 mb-2">{selectedAnalysis.rating}</p>}
                                                openIndex={openIndex}
                                                index={2}
                                                score={selectedAnalysis.relevancyScore}
                                                handleToggle={handleToggle}
                                            />
                                            <AccordionSection
                                                title="Relevancy Explanation"
                                                content={<p className="text-center font-semibold text-gray-700 mb-2">Relevancy evaluates how closely your response aligns with the question.</p>}
                                                openIndex={openIndex}
                                                index={3}
                                                handleToggle={handleToggle}
                                            />
                                            <AccordionSection
                                                title="Poor Starter Word"
                                                content={
                                                    <>
                                                        {selectedAnalysis.poorSentenceStarters && Object.keys(selectedAnalysis.poorSentenceStarters).length > 0 ? (
                                                            Object.entries(selectedAnalysis.poorSentenceStarters).map(([key, value]: any) => (
                                                                <p key={key} className="text-center text-red-700 font-semibold mb-2">
                                                                    {value}
                                                                </p>
                                                            ))
                                                        ) : (
                                                            <p className="text-center text-red-700 font-semibold mb-2">No poor Starter word</p>
                                                        )}

                                                    </>
                                                }
                                                openIndex={openIndex}
                                                index={4}
                                                handleToggle={handleToggle}
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <h1 className="text-lg mt-2 mb-2 font-manrope font-semibold">Your Weakness</h1>
                                            <AccordionSection
                                                title="Weaknesses"
                                                content={
                                                    <>
                                                        {selectedAnalysis.weaknesses && Object.keys(selectedAnalysis.weaknesses).length > 0 ? (
                                                            Object.entries(selectedAnalysis.weaknesses).map(([key, value]: any) => (
                                                                <div className='flex items-center gap-2'>
                                                                    <p><GoDotFill /></p>
                                                                    <p key={key} className="text-start  text-gray-700 font-semibold">
                                                                        {value}
                                                                    </p>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <p className="text-center text-red-700 font-semibold mb-2">No weaknesses data</p>
                                                        )}
                                                    </>
                                                }
                                                openIndex={openIndex}
                                                index={5}
                                                handleToggle={handleToggle}
                                            />
                                            <AccordionSection
                                                title="Repetition"
                                                content={
                                                    <div className="text-center font-semibold text-gray-700 mb-2">
                                                        {selectedAnalysis.repetition && typeof selectedAnalysis.repetition === 'object' 
                                                            ? selectedAnalysis.repetition.textAnalysis || 'No repetition data'
                                                            : selectedAnalysis.repetition || 'No repetition data'
                                                        }
                                                    </div>
                                                }
                                                openIndex={openIndex}
                                                index={6}
                                                handleToggle={handleToggle}
                                            />
                                            <AccordionSection
                                                title="Filler Words"
                                                content={
                                                    <>
                                                        {selectedAnalysis.fillerWords && Object.keys(selectedAnalysis.fillerWords).length > 0 ? (
                                                            Object.entries(selectedAnalysis.fillerWords).map(([key, value]: any) => (
                                                                <p key={key} className="text-center text-red-700 font-semibold mb-2">
                                                                    {key}: {value}
                                                                </p>
                                                            ))
                                                        ) : (
                                                            <p className="text-center text-red-700 font-semibold mb-2">No fillerwords data</p>
                                                        )}

                                                    </>
                                                }
                                                openIndex={openIndex}
                                                index={7}
                                                handleToggle={handleToggle}
                                            />
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}

export default ReportSidebar;
