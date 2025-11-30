import React, { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/Common/shadcnui/button";
import { Input } from "@/components/Common/shadcnui/input";
import { Edit2, MailIcon, MapPinIcon, PhoneIcon, SaveIcon, UploadIcon, User, UserIcon } from 'lucide-react';
import { Label } from "@/components/Common/shadcnui/label";
import { saveProfileData, parseResume } from "@/services/operations/UserOperations.ts"
import { useDispatch, useSelector } from "react-redux";
import { ResumeData, setResumeData } from "@/slices/Resume/Resume.slice.ts";
import { RootState } from "@/slices/store.ts";
import { toast } from "sonner";
import ProfileInput from '../Common/InputField/ProfileInput';

const Personal = () => {
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const dispatch = useDispatch();
    const [image, setImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const user = useSelector((state: RootState) => state.auth.user);

    const parsedResume: ResumeData | null = useSelector((state: RootState) => state.resume.data);

    const initialFormData = {
        firstName: user?.name ? user.name.split(" ")[0] : "",
        lastName: user?.name ? user.name.split(" ")[1] || "" : "",
        email: user?.email || "",
        phone: user?.phone || "",
        address: user?.address || "",
        city: user?.city || "",
        state: user?.state || "",
        profileImage: user?.profileImage || null
    };

    const [formData, setFormData] = useState(initialFormData);

    // Update form data when user data changes
    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.name ? user.name.split(" ")[0] : "",
                lastName: user.name ? user.name.split(" ")[1] || "" : "",
                email: user.email || "",
                phone: user.phone || "",
                address: user.address || "",
                city: user.city || "",
                state: user.state || "",
                profileImage: user.profileImage || null
            });
        }
    }, [user]);

    // Update form data when resume is parsed
    useEffect(() => {
        if (parsedResume) {
            setFormData(prevData => ({
                ...prevData,
                firstName: parsedResume.name.split(' ')[0] || prevData.firstName,
                lastName: parsedResume.name.split(' ')[1] || prevData.lastName,
                email: parsedResume.contactInformation?.email || prevData.email,
                phone: parsedResume.contactInformation?.phone || prevData.phone,
                address: parsedResume.contactInformation?.address || prevData.address,
                city: parsedResume.contactInformation?.city || prevData.city,
                state: parsedResume.contactInformation?.state || prevData.state,
                profileImage: image || prevData.profileImage
            }));
            setIsEditing(true);
        }
    }, [parsedResume, image]);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
                setFormData(prev => ({
                    ...prev,
                    profileImage: reader.result as string
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAvatarClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const toggleEdit = () => {
        if (isEditing) {
            // Reset form data to initial stjate when canceling edit
            setFormData(initialFormData);
        }
        setIsEditing(!isEditing);
        setSaveSuccess(false);
    };


    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setResumeFile(file);
            setLoading(true);
            setError(null);

            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await parseResume(formData);
                const processedData = {
                    ...response.data.extracted_data,
                    education: response.data.extracted_data.education.map((edu: any) => ({
                        ...edu,
                        startDate: new Date(edu.startDate).toISOString(),
                        endDate: new Date(edu.endDate).toISOString(),
                    })),
                };

                dispatch(setResumeData(processedData));
                setIsEditing(true);
            } catch (error) {
                console.error('Error:', error);
                setError('Failed to upload Resume');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [id]: value
        }));
    };

    const handleSave = async () => {
        setSaveLoading(true);
        setError(null);

        try {
            const profileData = {
                name: `${formData.firstName} ${formData.lastName}`.trim(),
                address: formData.address,
                phone: formData.phone,
                city: formData.city,
                state: formData.state
            };

            const response: any = await saveProfileData(profileData);
            if (response.data.success) {
                setSaveSuccess(true);
                setIsEditing(false);
            } else {
                setError(response.message || 'Failed to save profile data');
            }
        } catch (error) {
            toast.error((error as any).response.data.errors[0]);
            console.error('Error saving profile:', error);
            setError('Failed to save profile data. Please try again.');
        } finally {
            setSaveLoading(false);
        }
    };

    return (
        <div className="space-y-4 p-4 sm:p-6 md:p-8 w-full">
            <div className="w-full flex items-center justify-end">
                {isEditing ? (
                    <button
                        onClick={handleSave}
                        disabled={saveLoading}
                        className="p-2 md:p-3 border rounded-full font-dm-sans hover:bg-gray-50"
                    >
                        {saveLoading ? (
                            <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                        ) : (
                            <SaveIcon className="w-4 h-4 md:w-5 md:h-5" />
                        )}
                    </button>
                ) : (
                    <button
                        onClick={toggleEdit}
                        className="border p-2 md:p-3 rounded-full font-dm-sans hover:bg-gray-50"
                    >
                        <Edit2 className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                )}
            </div>

            {saveSuccess && !isEditing && (
                <div className="bg-green-50 font-manrope text-green-700 p-2 md:p-4 rounded-md mb-4 text-sm md:text-base">
                    Profile saved successfully!
                </div>
            )}

            {error && (
                <div className="bg-red-50 font-manrope text-sm font-semibold text-red-700 p-2 md:p-4 rounded-md mb-4">
                    {error}
                </div>
            )}

            <div className="w-full flex flex-col md:flex-row items-center md:justify-between gap-4">
                <div className="grid w-full md:w-[50%] grid-cols-1 gap-y-4 md:gap-y-6">
                    <ProfileInput
                        name="First Name"
                        id="firstName"
                        formData={formData}
                        handleChange={handleChange}
                        isEditing={isEditing}
                        icon={<UserIcon className="w-4 h-4 md:w-5 md:h-5" />}
                    />
                    <ProfileInput
                        name="Last Name"
                        id="lastName"
                        formData={formData}
                        handleChange={handleChange}
                        isEditing={isEditing}
                        icon={<UserIcon className="w-4 h-4 md:w-5 md:h-5" />}
                    />
                </div>
                <div className="space-y-3 rounded-lg w-full md:w-[50%] p-4 md:p-6 h-auto border font-manrope border-gray-200 bg-white">
                    <div
                        onClick={handleAvatarClick}
                        className="mx-auto h-12 md:h-24 w-12 md:w-24 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                    >
                        {image ? (
                            <img
                                src={image}
                                alt="Profile"
                                className="h-12 md:h-24 w-12 md:w-24 rounded-full object-cover"
                            />
                        ) : (
                            <User className="h-6 md:h-8 w-6 md:w-8 text-gray-500" />
                        )}
                    </div>

                    <h2 className="text-center text-sm md:text-base font-semibold text-gray-900">
                        Profile Picture
                    </h2>

                    <p className="text-center text-xs md:text-sm text-gray-800">
                        For best results, use a square image at least 248px x 248px
                    </p>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="imageUpload"
                    />

                    <div className="flex justify-center">
                        <label htmlFor="imageUpload">
                            <Button
                                className="border border-blue-200 font-semibold p-3 md:p-4 w-32 md:w-48 rounded-md hover:bg-blue-50 bg-blue-50/50 text-gray-700"
                                type="button"
                            >
                                Upload Avatar
                            </Button>
                        </label>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProfileInput
                    name="Email"
                    id="email"
                    formData={formData}
                    handleChange={handleChange}
                    isEditing={isEditing}
                    icon={<MailIcon className="w-4 h-4 md:w-5 md:h-5" />}
                />
                <ProfileInput
                    name="Phone"
                    id="phone"
                    formData={formData}
                    handleChange={handleChange}
                    isEditing={isEditing}
                    icon={<PhoneIcon className="w-4 h-4 md:w-5 md:h-5" />}
                />
            </div>

            <div>
                <ProfileInput
                    name="Address"
                    id="address"
                    formData={formData}
                    handleChange={handleChange}
                    isEditing={isEditing}
                    icon={<MapPinIcon className="w-4 h-4 md:w-5 md:h-5" />}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <ProfileInput
                        name="City"
                        id="city"
                        formData={formData}
                        handleChange={handleChange}
                        isEditing={isEditing}
                        icon={<MapPinIcon className="w-4 h-4 md:w-5 md:h-5" />}
                    />
                </div>
                <div>
                    <ProfileInput
                        name="State"
                        id="state"
                        formData={formData}
                        handleChange={handleChange}
                        isEditing={isEditing}
                        icon={<MapPinIcon className="w-4 h-4 md:w-5 md:h-5" />}
                    />
                </div>
            </div>

            <div className="space-y-2 font-manrope">
                <Label htmlFor="resume" className="">
                    Resume
                </Label>
                <div className="flex  md:flex-row items-center space-y-2 md:space-y-0 space-x-2">
                    <Input
                        type="file"
                        id="resume"
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                    />
                    <Button
                        className='border-[0.5px] font-semibold p-6 w-42 rounded-md border-[#c3deff] hover:bg-[#e5f1ff] bg-[#f6faff] text-[#4a516d]'
                        onClick={() => document.getElementById('resume')?.click()}
                        disabled={loading}
                    >
                        {loading ? (
                            "Uploading..."
                        ) : (
                            <>
                                <UploadIcon className="w-4 h-4 md:w-5 md:h-5 mr-2" /> Upload Resume
                            </>
                        )}
                    </Button>
                    <span className="text-xs md:text-sm font-heading-font">
                        {resumeFile ? resumeFile.name : "No file chosen"}
                    </span>
                </div>
                <p className="text-xs md:text-sm">Accepted formats: PDF, DOC, DOCX</p>
            </div>
        </div>


    );
}

export default Personal;
