import { useState } from 'react'
import { Button } from "@/components/Common/shadcnui/button"
import { Progress } from "@/components/Common/shadcnui/progress"
import { Badge } from "@/components/Common/shadcnui/badge"
import { Input } from "@/components/Common/shadcnui/input"
import { Card, CardContent } from "@/components/Common/shadcnui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/Common/shadcnui/dialog';
import { Linkedin, Github, X, Twitter, Instagram } from "lucide-react"
import '@/components/Common/profile.css'
import ComboBox from '../Common/ComboBox/ComboBox'
import { Link } from 'react-router-dom'

const SkillsSections = () => {
    const [isEditingTagline, setIsEditingTagline] = useState(false)
    const [tagline, setTagline] = useState("");
    const [linkedin, setLinkedin] = useState('');
    const [github, setGithub] = useState('');
    const [twitter, setTwitter] = useState('');
    const [instagram, setInstagram] = useState('');

    const handleSave = () => {
        console.log({ linkedin, github, twitter, instagram });
    };
    const [skills, setSkills] = useState([
        "CSS", "HTML", "NodeJs", "React.js", "Express.Js", "Next.Js",
        "MongoDB", "PostgreSQL", "Javascript", "Typescript"
    ])

    const frameworks = [
        { value: "next.js", label: "Next.js" },
        { value: "sveltekit", label: "SvelteKit" },
        { value: "nuxt.js", label: "Nuxt.js" },
        { value: "remix", label: "Remix" },
        { value: "astro", label: "Astro" },
        { value: "gatsby", label: "Gatsby" },
        { value: "vue.js", label: "Vue.js" },
        { value: "angular", label: "Angular" },
        { value: "react", label: "React" },
        { value: "ember.js", label: "Ember.js" },
        { value: "backbone.js", label: "Backbone.js" },
    ]

    const addSkill = (newSkill: string) => {
        if (newSkill && !skills.includes(newSkill)) {
            setSkills([...skills, newSkill])
        }
    }

    const removeSkill = (skillToRemove: string) => {
        setSkills(skills.filter(skill => skill !== skillToRemove))
    }

    return (
        <div className="m-2 h-full">
            <Card className='font-dm-sans overflow-y-scroll custom-scrollbar h-full border-[0.5px] border-[#76757568]'>
                <CardContent className="space-y-8 p-6">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold">Social</h2>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="text-sm font-medium w-16 h-8">
                                        Edit
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className='font-dm-sans'>
                                    <DialogHeader>
                                        <DialogTitle>Edit Social Profiles</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <Input
                                            placeholder="LinkedIn Profile URL"
                                            value={linkedin}
                                            onChange={(e) => setLinkedin(e.target.value)}
                                        />
                                        <Input
                                            placeholder="GitHub Profile URL"
                                            value={github}
                                            onChange={(e) => setGithub(e.target.value)}
                                        />
                                        <Input
                                            placeholder="Twitter Profile URL"
                                            value={twitter}
                                            onChange={(e) => setTwitter(e.target.value)}
                                        />
                                        <Input
                                            placeholder="Instagram Profile URL"
                                            value={instagram}
                                            onChange={(e) => setInstagram(e.target.value)}
                                        />
                                    </div>
                                    <DialogClose>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={handleSave}>Save</Button>
                                        </DialogFooter>
                                    </DialogClose>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <div className="flex space-x-4">
                            <Link to={linkedin} target='_blank'>
                                <Button variant="outline" size="icon" className="rounded-full">
                                    <Linkedin className="w-5 h-5 text-blue-600" />
                                </Button>
                            </Link>
                            <Link to={github} target='_blank'>
                                <Button variant="outline" size="icon" className="rounded-full">
                                    <Github className="w-5 h-5 text-white" />
                                </Button>
                            </Link>
                            <Link to={twitter} target='_blank'>
                                <Button variant="outline" size="icon" className="rounded-full">
                                    <Twitter className="w-5 h-5 text-blue-600" />
                                </Button>
                            </Link>
                            <Link to={instagram} target='_blank'>
                                <Button variant="outline" size="icon" className="rounded-full">
                                    <Instagram className="w-5 h-5 text-red-500" />
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold ">Profile Health</h2>
                            <span className="text-green-500 text-sm font-semibold bg-green-100 px-2 py-1 rounded">EXCELLENT</span>
                        </div>
                        <p className="text-sm">
                            Students with at least 90% profile completion have a better chance of getting selected!
                        </p>
                        <Progress value={55} className="h-3 " />
                        <div className="flex justify-between text-sm font-medium">
                            <span>55% completed</span>
                            <span>100%</span>
                        </div>
                        <p className="text-sm text-green-600 font-medium">
                            Add 1 Work Experience to improve your profile health
                        </p>
                    </div>

                    {/* Tagline Section */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold ">Tagline</h2>
                            <Button
                                variant="outline"
                                className='text-sm font-medium w-16 h-8'
                                onClick={() => setIsEditingTagline(!isEditingTagline)}
                            >
                                {isEditingTagline ? 'Save' : 'Edit'}
                            </Button>
                        </div>
                        {isEditingTagline ? (
                            <Input
                                value={tagline}
                                onChange={(e) => setTagline(e.target.value)}
                                placeholder="Add your tagline here..."
                                className='font-geist border-[0.5px] '
                            />
                        ) : (
                            <p className="text-sm">{tagline || "No Tagline Added"}</p>
                        )}
                    </div>

                    {/* Skills Section */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Skills</h2>
                        <div className="flex flex-wrap gap-2">
                            {skills.map((skill) => (
                                <Badge key={skill} variant="secondary" className="text-sm pl-2 pr-1 py-1 flex items-center">
                                    {skill}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="ml-1 h-auto p-0"
                                        onClick={() => removeSkill(skill)}
                                    >
                                        <X className="w-3 h-3" />
                                    </Button>
                                </Badge>
                            ))}
                        </div>
                        <div className="flex ">
                            <ComboBox
                                frameworks={frameworks}
                                addSkill={addSkill}
                            />
                            {/* <Button onClick={() => addSkill(newSkill)}>
                                <Plus className="w-4 h-4 mr-2" /> Add Skill
                            </Button> */}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div >
    )
}

export default SkillsSections;
