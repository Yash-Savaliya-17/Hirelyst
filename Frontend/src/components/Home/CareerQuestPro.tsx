import { useState } from "react";
import { Button } from "@/components/Common/shadcnui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/Common/shadcnui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Common/shadcnui/tabs";
import { Briefcase, Lightbulb, Users, GraduationCap, Trophy, BookOpen, Brain } from "lucide-react";


interface Feature {
    icon: JSX.Element;
    title: string;
    description: string;
}

const CareerQuestPro = () => {
    const [activeTab, setActiveTab] = useState("quizzes");

    const quizCategories = [
        { title: 'Technical Skills', icon: <Lightbulb className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />, color: 'bg-yellow-100' },
        { title: 'Soft Skills', icon: <Users className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />, color: 'bg-green-100' },
        { title: 'Industry Knowledge', icon: <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />, color: 'bg-blue-100' },
    ];

    const interviewLevels = [
        { title: 'Entry Level', icon: <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />, color: 'bg-green-100' },
        { title: 'Mid Career', icon: <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />, color: 'bg-blue-100' },
        { title: 'Senior Position', icon: <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />, color: 'bg-purple-100' },
    ];

    const resources = [
        { title: 'Resume Builder', icon: <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-500" />, color: 'bg-indigo-100' },
        { title: 'Job Listings', icon: <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />, color: 'bg-red-100' },
        { title: 'Career Advice', icon: <Lightbulb className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />, color: 'bg-amber-100' },
    ];

    const features: { [key: string]: Feature[] } = {
        quizzes: [
            { icon: <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />, title: "Adaptive Learning", description: "Quizzes adjust to your skill level" },
            { icon: <Users className="h-5 w-5 sm:h-6 sm:w-6" />, title: "Peer Comparison", description: "See how you stack up against others" },
            { icon: <Trophy className="h-5 w-5 sm:h-6 sm:w-6" />, title: "Skill Certificates", description: "Earn certificates for your achievements" },
        ],
        interviews: [
            { icon: <Brain className="h-5 w-5 sm:h-6 sm:w-6" />, title: "AI-Powered", description: "Realistic interview scenarios" },
            { icon: <Users className="h-5 w-5 sm:h-6 sm:w-6" />, title: "Industry Specific", description: "Tailored to your field" },
            { icon: <Trophy className="h-5 w-5 sm:h-6 sm:w-6" />, title: "Detailed Feedback", description: "Get insights to improve" },
        ],
        resources: [
            { icon: <Briefcase className="h-5 w-5 sm:h-6 sm:w-6" />, title: "Job Matching", description: "Find opportunities that fit your skills" },
            { icon: <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" />, title: "Learning Paths", description: "Guided career development tracks" },
            { icon: <Lightbulb className="h-5 w-5 sm:h-6 sm:w-6" />, title: "Expert Insights", description: "Tips from industry professionals" },
        ],
    };
    return (
        <div className="min-h-screen w-full p-4 sm:p-6 mb-10 bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100">
            <Card className="max-w-6xl mx-auto shadow-lg">
                <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-t-lg p-6">
                    <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold text-center">CareerBoost Pro</CardTitle>
                    <CardDescription className="text-center text-base sm:text-lg text-emerald-100 mt-2">
                        Empower Your Future with Quizzes, AI Interviews, and Career Resources
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                    <Tabs defaultValue="quizzes" className="w-full" onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-2 sm:mb-6 mb-20">
                            <TabsTrigger value="quizzes">Skill Quizzes</TabsTrigger>
                            <TabsTrigger value="interviews">AI Interviews</TabsTrigger>
                            <TabsTrigger value="resources">Career Resources</TabsTrigger>
                        </TabsList>
                        <TabsContent value="quizzes">
                            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                {quizCategories.map((category) => (
                                    <Card key={category.title} className={`flex flex-col justify-between hover:shadow-md transition-shadow ${category.color}`}>
                                        <CardHeader className="p-4">
                                            <div className="flex items-center space-x-2">
                                                {category.icon}
                                                <CardTitle className="text-lg sm:text-xl">{category.title}</CardTitle>
                                            </div>
                                            <CardDescription className="text-sm mt-2">Boost your {category.title.toLowerCase()} with adaptive quizzes</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-4">
                                            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-sm sm:text-base">Start Quiz</Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>
                        <TabsContent value="interviews">
                            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                {interviewLevels.map((level) => (
                                    <Card key={level.title} className={`flex flex-col justify-between hover:shadow-md transition-shadow ${level.color}`}>
                                        <CardHeader className="p-4">
                                            <div className="flex items-center space-x-2">
                                                {level.icon}
                                                <CardTitle className="text-lg sm:text-xl">{level.title}</CardTitle>
                                            </div>
                                            <CardDescription className="text-sm mt-2">Practice {level.title.toLowerCase()} interviews with our AI</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-4">
                                            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-sm sm:text-base">Start Interview</Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>
                        <TabsContent value="resources">
                            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                {resources.map((resource) => (
                                    <Card key={resource.title} className={`flex flex-col justify-between hover:shadow-md transition-shadow ${resource.color}`}>
                                        <CardHeader className="p-4">
                                            <div className="flex items-center space-x-2">
                                                {resource.icon}
                                                <CardTitle className="text-lg sm:text-xl">{resource.title}</CardTitle>
                                            </div>
                                            <CardDescription className="text-sm mt-2">Access valuable {resource.title.toLowerCase()} tools</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-4">
                                            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-sm sm:text-base">Explore</Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
            <div className="mt-8 sm:mt-12 bg-white rounded-lg shadow-md p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-center text-emerald-800 mb-4 sm:mb-6">Platform Features</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {features[activeTab].map((feature: any) => (
                        <div key={feature.title} className="flex items-start space-x-3 p-4 border rounded-md hover:shadow-lg transition-shadow">
                            {feature.icon}
                            <div>
                                <h3 className="text-lg font-semibold">{feature.title}</h3>
                                <p className="text-sm text-gray-600">{feature.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default CareerQuestPro
