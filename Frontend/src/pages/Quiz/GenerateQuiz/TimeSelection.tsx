import {Button} from '@/components/Common/shadcnui/button'
import {Input} from '@/components/Common/shadcnui/input'
import {Popover, PopoverContent, PopoverTrigger} from '@/components/Common/shadcnui/popover'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/Common/shadcnui/select'
import {cn} from '@/lib/utils'
import {format} from 'date-fns'
import {CalendarIcon, CheckCircle, Clock, Timer} from 'lucide-react'
import React from 'react'
import {Calendar} from "@/components/Common/shadcnui/calendar"


const TimeSelection = ({ duration, setDuration, setStartHour, setStartMinute, startAMPM, setStartAMPM, startMinute, startHour, date, setDate, handleSubmit, handleCreateQuiz }: any) => {
    // console.log(switchValue);
    return (
        <div className="space-y-8 p-7 font-dm-sans">
            <div className="flex gap-6">
                {/* Start Time */}
                <div className="space-y-2 w-[45%]">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Start Time (HH:MM AM/PM)
                    </label>
                    <div className="flex gap-2">
                        <Select onValueChange={(value) => setStartHour(value)}>
                            <SelectTrigger className="w-40 p-6">
                                <SelectValue placeholder="00 : HH" />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 13 }, (_, i) => (
                                    <SelectItem className={`${startHour === i.toString().padStart(2, '0') ? "bg-gray-200" : ""}`} key={i} value={i.toString().padStart(2, '0')}>
                                        {i.toString().padStart(2, '0')} : HH
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select onValueChange={(value) => setStartMinute(value)}>
                            <SelectTrigger className="w-40 p-6">
                                <SelectValue placeholder="00 : MM" />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 61 }, (_, i) => (
                                    <SelectItem className={`${startMinute === i.toString().padStart(2, '0') ? "bg-gray-200" : ""}`} key={i} value={i.toString().padStart(2, '0')}>
                                        {i.toString().padStart(2, '0')} : MM
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select onValueChange={(value) => setStartAMPM(value)}>
                            <SelectTrigger className="w-40 p-6">
                                <SelectValue placeholder="AM" />
                            </SelectTrigger>
                            <SelectContent>
                                {["AM", "PM"].map((i) => (
                                    <SelectItem className={`${startAMPM === i ? "bg-gray-200" : ""}`} key={i} value={i.toString().padStart(2, '0')}>
                                        {i.toString().padStart(2, '0')}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Duration */}
                <div className="space-y-2 w-[25%]">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Timer className="h-4 w-4" />
                        Duration (minutes)
                    </label>
                    <Input
                        type="number"
                        placeholder="Duration (minutes)"
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value))}
                        min="1"
                        className="h-12"
                    />
                </div>

                {/* Exam Date */}
                <div className="space-y-2 w-[25%]">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        Exam Date
                    </label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-full h-12 justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Total Marks */}
                {/* <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        Total Marks
                    </label>
                    <Input
                        type="number"
                        placeholder="Total marks"
                        value={totalMarks}
                        onChange={(e) => setTotalMarks(e.target.value)}
                        min="1"
                        className="h-12"
                    />
                </div> */}
            </div>


            {/* Submit Button */}
            <div className="flex justify-center pt-6">
                <Button
                    onClick={handleSubmit(handleCreateQuiz)}
                    className="w-[200px] bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Show Questions
                </Button>
            </div>
        </div >
    )
}

export default TimeSelection
