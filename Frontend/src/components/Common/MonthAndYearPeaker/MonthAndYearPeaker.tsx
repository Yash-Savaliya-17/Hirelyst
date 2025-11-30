import React, {useEffect, useState} from 'react';
import {CardHeader} from "@/components/Common/shadcnui/card";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/Common/shadcnui/popover";
import {Button} from "@/components/Common/shadcnui/button";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/Common/shadcnui/select";

interface MonthAndYearPickerProps {
    startYear?: number;
    startMonth?: number;
    disabled?: boolean;
    onDateChange?: (date: string) => void;
}

const MonthAndYearPicker: React.FC<MonthAndYearPickerProps> = ({
                                                                   startYear = new Date().getFullYear(),
                                                                   startMonth = new Date().getMonth() + 1,
                                                                   disabled = false,
                                                                   onDateChange
                                                               }) => {
    const [selectedMonth, setSelectedMonth] = useState(startMonth);
    const [selectedYear, setSelectedYear] = useState(startYear);

    useEffect(() => {
        setSelectedMonth(startMonth);
        setSelectedYear(startYear);
    }, [startMonth, startYear]);

    useEffect(() => {
        if (onDateChange) {
            // Format: YYYY-MM-DD
            const formattedDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
            onDateChange(formattedDate);
        }
    }, [selectedMonth, selectedYear, onDateChange]);

    const handleMonthChange = (value: string) => {
        setSelectedMonth(parseInt(value));
    };

    const handleYearChange = (value: string) => {
        setSelectedYear(parseInt(value));
    };

    return (
        <CardHeader className="p-0 font-manrope">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="flex p-5 pt-6 items-center gap-2"
                                disabled={disabled}
                            >
                                <CalendarDaysIcon className="h-4 w-4"/>
                                <span>
                                    <span className="font-medium">
                                        {new Date(selectedYear, selectedMonth - 1).toLocaleString("default", {month: "long"})}
                                    </span>
                                    {' '}{selectedYear}
                                </span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-auto">
                            <div className="grid grid-cols-2 gap-4 p-4">
                                <Select
                                    onValueChange={handleMonthChange}
                                    value={selectedMonth.toString()}
                                    disabled={disabled}
                                >
                                    <SelectTrigger>
                                        <SelectValue>
                                            {new Date(selectedYear, selectedMonth - 1).toLocaleString("default", {month: "long"})}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent position="popper">
                                        {Array.from({length: 12}, (_, i) => i + 1).map((month) => (
                                            <SelectItem key={month} value={month.toString()}>
                                                {new Date(0, month - 1).toLocaleString("default", {month: "long"})}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select
                                    onValueChange={handleYearChange}
                                    value={selectedYear.toString()}
                                    disabled={disabled}
                                >
                                    <SelectTrigger>
                                        <SelectValue>{selectedYear}</SelectValue>
                                    </SelectTrigger>
                                    <SelectContent position="popper">
                                        {Array.from({length: 20}, (_, i) => new Date().getFullYear() - 10 + i).map((year) => (
                                            <SelectItem key={year} value={year.toString()}>
                                                {year}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
        </CardHeader>
    );
};

function CalendarDaysIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M8 2v4"/>
            <path d="M16 2v4"/>
            <rect width="18" height="18" x="3" y="4" rx="2"/>
            <path d="M3 10h18"/>
            <path d="M8 14h.01"/>
            <path d="M12 14h.01"/>
            <path d="M16 14h.01"/>
            <path d="M8 18h.01"/>
            <path d="M12 18h.01"/>
            <path d="M16 18h.01"/>
        </svg>
    );
}

export default MonthAndYearPicker;
