import React, { useState } from 'react';
import { Activity, BarChart2, Book, Brain, Trophy, Users } from 'lucide-react';
import { Progress } from "@/components/Common/shadcnui/progress";
import { BentoGrid, BentoGridItem } from "@/components/Common/shadcnui/bento-grid";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/Common/shadcnui/select";
import { Button } from "@/components/Common/shadcnui/button";
import { cn } from "@/lib/utils.ts";
import { motion } from "framer-motion"
import { BackgroundBeams } from '@/components/Common/shadcnui/background-beams';

const InterviewPracticeCard = () => {
    const [selectedDomain, setSelectedDomain] = useState<string>("Web Development");
    const [selectedCodomain, setSelectedCodomain] = useState<string>("Backend");
    const [selectedExperience, setSelectedExperience] = useState<string>("0-2 years");

    const domainCodomainMap: any = {
        "Web Development": ["Frontend", "Backend", "Full Stack", "DevOps"],
        "Mobile Development": ["React Native", "Flutter", "iOS", "Android"],
        "Cloud Computing": ["AWS", "Azure", "Google Cloud", "Kubernetes"],
        "Data Engineering": ["Big Data", "Machine Learning", "Data Warehousing", "ETL"],
        "Cybersecurity": ["Network Security", "Application Security", "Cloud Security", "Penetration Testing"]
    };

    const domains = Object.keys(domainCodomainMap);
    const experiences = ["0-2 years", "3-5 years", "6+ years"];

    const handleDomainChange = (value: string) => {
        setSelectedDomain(value);
        setSelectedCodomain(""); // Reset codomain when domain changes
    };

    return (
        <div className="flex flex-col justify-between h-full pt-2">
            <div className="space-y-3">
                <Select
                    onValueChange={handleDomainChange}
                    value={selectedDomain}
                >
                    <SelectTrigger className="w-full h-8">
                        <SelectValue placeholder="Select Domain" />
                    </SelectTrigger>
                    <SelectContent className='font-manrope'>
                        {domains.map((domain) => (
                            <SelectItem key={domain} value={domain}>
                                {domain}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    onValueChange={(value) => setSelectedCodomain(value)}
                    value={selectedCodomain}
                    disabled={!selectedDomain}
                >
                    <SelectTrigger className="w-full h-8">
                        <SelectValue placeholder="Select Specialization" />
                    </SelectTrigger>
                    <SelectContent className='font-manrope'>
                        {selectedDomain && domainCodomainMap[selectedDomain].map((codomain: string) => (
                            <SelectItem key={codomain} value={codomain}>
                                {codomain}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    onValueChange={(value) => setSelectedExperience(value)}
                    value={selectedExperience}
                >
                    <SelectTrigger className="w-full h-8">
                        <SelectValue placeholder="Experience Level" />
                    </SelectTrigger>
                    <SelectContent className='font-manrope'>
                        {experiences.map((experience) => (
                            <SelectItem key={experience} value={experience}>
                                {experience}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex justify-end mt-3">
                <Button
                    disabled={!selectedDomain || !selectedCodomain || !selectedExperience}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:opacity-90 transition-opacity h-8 w-32"
                >
                    Start Practice
                </Button>
            </div>
        </div>
    );
};

const AnalyticsCard = () => {
    const data = [
        { name: 'Technical', value: 75 },
        { name: 'Behavioral', value: 85 },
        { name: 'System Design', value: 69 },
        { name: 'Backend Development', value: 85 }
    ];

    return (
        <div className="flex flex-col h-full p-3">
            <div className="grid grid-cols-2 gap-3">
                {data.map((item) => (
                    <div key={item.name} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-medium">{item.name}</span>
                            <span className="font-semibold text-neutral-700">{item.value}%</span>
                        </div>
                        <Progress
                            value={item.value}
                            className="h-1.5 bg-neutral-200"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

const ResourcesCard = () => {
    const resources = [
        { title: 'Technical Guide', count: '12 lessons', icon: Book },
        { title: 'System Design', count: '8 lessons', icon: Book },
        { title: 'DSA', count: '10 lessons', icon: Book },
        { title: 'Mock Interviews', count: '5 lessons', icon: Book }
    ];

    return (
        <div className="flex flex-col h-full p-3">
            <div className="grid grid-cols-2 gap-3">
                {resources.map((resource) => (
                    <div
                        key={resource.title}
                        className="flex items-center space-x-2 p-2 bg-neutral-100 dark:bg-neutral-900 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors"
                    >
                        <resource.icon className="h-4 w-4 text-neutral-500" />
                        <div className="flex flex-col">
                            <span className="text-xs font-medium truncate">{resource.title}</span>
                            <span className="text-[10px] text-neutral-500">{resource.count}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const QuizProgressCard = () => {
    return (
        <div className="flex flex-col justify-between h-full space-y-2 p-4">
            <div className="text-xs text-neutral-600 font-semibold dark:text-neutral-400">
                Software Engineering Quiz
            </div>
            <div className="space-y-2">
                <div className="flex justify-between text-xs mb-1">
                    <span>Progress</span>
                    <span className="text-blue-600 dark:text-blue-400">45%</span>
                </div>
                <Progress value={45} className="h-1.5 bg-neutral-200" />
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                        <div className="text-blue-600 dark:text-blue-400">Questions</div>
                        <div className="font-medium mt-1">9/20</div>
                    </div>
                    <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-900/20">
                        <div className="text-cyan-600 dark:text-cyan-400">Time Left</div>
                        <div className="font-medium mt-1">15:30</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const LeaderboardCard = () => {
    const leaderboardData = [
        { name: 'Jalay', score: 98 },
        { name: 'Mit', score: 95 },
        { name: 'Kaushal', score: 92 }
    ];

    return (
        <div className="flex flex-col justify-between h-full p-4">
            <div className="space-y-2">
                {leaderboardData.map((user, i) => (
                    <div
                        key={user.name}
                        className="flex justify-between items-center p-2 bg-white dark:bg-black rounded-lg border border-neutral-100 dark:border-white/[0.2]"
                    >
                        <div className="flex items-center space-x-2">
                            <span className="text-xs text-neutral-500">#{i + 1}</span>
                            <span className="text-sm font-medium truncate">{user.name}</span>
                        </div>
                        <span className="text-sm text-cyan-600 dark:text-cyan-400">{user.score}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};


const InterviewHub = () => {
    const items = [
        {
            title: <h1 className='text-cyan-800'>AI Interview Practice</h1>,
            description: <p className='font-semibold'>Practice with our AI interviewer</p>,
            header: <InterviewPracticeCard />,
            className: "md:col-span-2",
            icon: <Users className="h-4 w-4 text-neutral-500" />
        },
        {
            title: <h1 className='text-cyan-800'>Active Quiz</h1>,
            description: <p className='font-semibold'>Current quiz progress</p>,
            header: <QuizProgressCard />,
            className: "md:col-span-1",
            icon: <Activity className="h-4 w-4 text-neutral-500" />
        },
        {
            title: <h1 className='text-cyan-800'>Top Performers</h1>,
            description: <p className='font-semibold'>Weekly leaderboard</p>,
            header: <LeaderboardCard />,
            className: "md:col-span-1",
            icon: <Trophy className="h-4 w-4 text-neutral-500" />
        },
        {
            title: <h1 className="text-cyan-800">AI Interview Practice</h1>,
            description: <p className='font-semibold'>Your skill breakdown</p>,
            header: <AnalyticsCard />,
            className: "md:col-span-1 row-span-1 md:row-span-1",
            icon: <BarChart2 className="h-4 w-4 text-neutral-500" />
        },
        {
            title: <h1 className='text-cyan-800'>Learning Resources</h1>,
            description: <p className='font-semibold'>Guides and practice materials</p>,
            header: <ResourcesCard />,
            className: "md:col-span-1 row-span-1 md:row-span-1",
            icon: <Book className="h-4 w-4 text-neutral-500" />
        }
    ];

    return (
       <div className="font-manrope dark:bg-neutral-900 relative overflow-hidden">
  <div className="absolute inset-0 pointer-events-none z-10">
    <BackgroundBeams className="opacity-30 scale-150 origin-center" />
  </div>

  <div className="mx-auto relative">
    <div className="text-center pt-16 pb-8">
      <div className="flex items-center justify-center gap-2 text-blue-600 font-medium mb-4">
        <Brain className="w-5 h-5" />
        <span>Interview Preparation</span>
      </div>
      <h2 className={cn(
        "text-3xl md:text-5xl font-bold mb-4",
        "bg-clip-text text-transparent",
        "bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900",
        "drop-shadow-sm"
      )}>
        AI Interview Master
      </h2>
      <p className="text-lg text-gray-600 max-w-2xl mx-auto px-4">
        Master your interview skills with interactive practice and real-time analysis
      </p>
    </div>

    <div className="px-6 sm:px-8 md:px-12 lg:px-20 py-8 md:py-16 pt-8 relative">
      <div className="absolute inset-0 bg-gradient-to-t from-white via-neutral-100 to-white"></div>

      <div className="relative z-40">
        <BentoGrid>
          {items.map((item, i) => (
            <BentoGridItem
              key={i}
              title={item.title}
              description={item.description}
              header={item.header}
              className={`
                shadow-md hover:scale-105
                sm:col-span-1 
                md:${i === 3 ? "col-span-2" : "col-span-1"}
                ${[3, 4].includes(i) && "h-64"}
              `}
              icon={item.icon}
            />
          ))}
        </BentoGrid>
      </div>
    </div>
  </div>

  {/* Gradient Overlay to blend edges */}
  <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white to-transparent pointer-events-none z-20"></div>
  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none z-20"></div>
</div>

    );
};
export default InterviewHub;
