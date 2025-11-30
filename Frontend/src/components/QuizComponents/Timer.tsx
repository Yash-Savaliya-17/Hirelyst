import {useEffect, useState} from 'react';

const Timer = ({startsAt, endsAt}: {startsAt:any, endsAt:any}) => {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });

    useEffect(() => {
        const timer = setInterval(() => {
            updateQuizStatus();
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const updateQuizStatus = () => {
        const now = new Date().getTime();
        const startTime = new Date(startsAt).getTime();
        const endTime = new Date(endsAt).getTime();

        if (now < startTime) {
            updateTimeLeft(startTime - now);
        } else if (now >= startTime && now < endTime) {
            updateTimeLeft(endTime - now);
        } else {
            setTimeLeft({days: 0, hours: 0, minutes: 0, seconds: 0});
        }
    };

    const updateTimeLeft = (difference: number) => {
        setTimeLeft({
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60)
        });
    };

    // if (loading) {
    //     return (
    //         <div>Loading...</div>
    //     )
    // }

    const TimeBox = ({value}: { value: number; label: string }) => (
        <div className="flex flex-col  items-center">
            <div className="bg-white  border border-gray-600 rounded-lg p-2 mb-1">
                <span
                    className="text-2xl font-primary-font font-mono font-bold text-gray-800  inline-block w-[1.5em] text-center">
                    {value}
                </span>
            </div>
        </div>
    );

    const AnimatedSeconds = ({value}: { value: number }) => (
        <div className="flex flex-col items-center">
            <div className="bg-white  border border-gray-600 rounded-lg p-2 mb-1 relative overflow-hidden">
                <span
                    className={`text-2xl font-primary-font font-mono font-bold text-gray-800 inline-block w-[1.5em] text-center`}>
                    {value}
                </span>
            </div>
        </div>
    );

    return (
        <div className="w-auto inline-block p-4  rounded-lg">
            <div className="flex  items-center justify-center gap-2 ">
                <TimeBox value={timeLeft.hours} label="HOURS"/>
                <TimeBox value={timeLeft.minutes} label="MINUTES"/>
                <AnimatedSeconds value={timeLeft.seconds}/>
            </div>
        </div>
    );
}

export default Timer
