import { useEffect, useState } from "react";
import { Button } from "@/components/Common/shadcnui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/Common/shadcnui/card";
import { Input } from "@/components/Common/shadcnui/input";
import { Label } from "@/components/Common/shadcnui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Common/shadcnui/tabs";
import { Switch } from "@/components/Common/shadcnui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/Common/shadcnui/radio-group";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, Edit2, EyeIcon, EyeOffIcon, Loader2, Lock, Mail, Save } from "lucide-react";
import { ChangePassword, sendVerificationMail } from "@/services/operations/authOperations";
import { updateEmail } from "@/services/operations/UserOperations";
import { useSelector } from "react-redux";

const Setting = () => {
    const [theme, setTheme] = useState('light')
    const [activeSection, setActiveSection] = useState('password');
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [currentEmail, setCurrentEmail] = useState("example@email.com");
    const [isEditing, setIsEditing] = useState(false);
    const [sendingMail, setSendingMail] = useState(false);
    const user = useSelector((root: any) => root.auth.user);

    useEffect(() => {
        setIsEmailVerified(user.isVerified);
        setCurrentEmail(user.email);
    }, [user]);

    const handleVerifyEmail = async () => {
        // Simulate email verification process
        setSendingMail(true);
        try {
            await sendVerificationMail();
            toast.success("Verification email sent successfully");
        } catch (e) {
            toast.error("Failed to send verification email");
        } finally {
            setSendingMail(false);
        }
    };

    const handleChangeEmail = async () => {
        setLoading(true);
        if (user.email == currentEmail) {
            toast.error("Email is same as current email");
            setLoading(false);
            setIsEditing(false);
            return;
        }
        try {
            await updateEmail(currentEmail);
            setLoading(false);
            setIsEditing(false);
            setIsEmailVerified(false);
            toast.success("Email updated successfully. Please verify your email.");
        } catch (e: any) {
            toast.error(e.response.data.errors[0] || "Failed to update email");
            setLoading(false);
            setCurrentEmail(user.email);
            setIsEditing(false);
        }
    };

    const handleChangePassword = async (e: any) => {
        e.preventDefault();
        const data = e.target.elements;
        const newPassword = data.newPassword.value;
        const confirmPassword = data.confirmPassword.value;
        const oldPassword = data.oldPassword.value;
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        try {
            setLoading(true);
            const response = await ChangePassword(oldPassword, newPassword);
            toast.success(response.data.message);
            setLoading(false);
        } catch (error: any) {
            setLoading(false);
            console.error("Password change failed:", error);
            toast.error(error.response.data.message);
        }
    };

    const handleThemeChange = (value: "light" | "dark") => {
        setTheme(value);
    };

    return (
        <div className="min-h-screen  p-6 flex flex-col ">
            <div className="w-full border-r">
                <p className="text-sm font-semibold font-manrope ">Manage your account settings and set e-mail preferences.</p>
            </div>
            <Tabs defaultValue="account" className="font-manrope w-full p-4">
                <TabsList className="grid w-full grid-cols-3 mb-5 bg-transparent  p-1 rounded-xl">
                    <TabsTrigger
                        value="account"
                        className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800 px-8 py-3 rounded-lg transition-all"
                    >
                        Password
                    </TabsTrigger>
                    <TabsTrigger
                        value="notifications"
                        className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800 px-8 py-3 rounded-lg transition-all"
                    >
                        Notifications
                    </TabsTrigger>
                    <TabsTrigger
                        value="appearance"
                        className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800 px-8 py-3 rounded-lg transition-all"
                    >
                        Appearance
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="account">
                    <Card className="w-full border-none shadow-lg bg-white/80 backdrop-blur-sm">
                        <CardHeader className="border-b border-blue-100/50">
                            <CardTitle className="text-2xl font-bold text-[#605DFF]">Account Settings</CardTitle>
                            <p className="">Manage your account security and email</p>

                            <div className="flex space-x-6 pt-6">
                                <button
                                    onClick={() => setActiveSection('password')}
                                    className={`
                  flex items-center text-sm space-x-2 pb-2 border-b-2 transition-colors
                  ${activeSection === 'password'
                                            ? 'border-blue-500 text-blue-700'
                                            : 'border-transparent text-gray-500 hover:text-blue-600'}
                `}
                                >
                                    <Lock size={16} className={activeSection === 'password' ? 'text-blue-500' : ''} />
                                    <span>Change Password</span>
                                </button>
                                <button
                                    onClick={() => setActiveSection('email')}
                                    className={`
                  flex items-center text-sm space-x-2 pb-2 border-b-2 transition-colors
                  ${activeSection === 'email'
                                            ? 'border-blue-500 text-blue-700'
                                            : 'border-transparent text-gray-500 hover:text-blue-600'}
                `}
                                >
                                    <Mail size={16} className={activeSection === 'email' ? 'text-blue-500' : ''} />
                                    <span>Change Email</span>
                                </button>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-8 pt-8">
                            {activeSection === 'password' && (
                                <form onSubmit={handleChangePassword} className="space-y-6">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="oldPassword" className="text-blue-900 font-medium">
                                                Current Password
                                            </Label>
                                            <div className="relative">
                                                <input
                                                    id="oldPassword"
                                                    type={showOldPassword ? "text" : "password"}
                                                    className="w-full font-manrope text-black placeholder:text-gray-500 rounded-lg border border-gray-200 text-sm pl-3 sm:pl-5 py-2 sm:py-3 focus:outline-none focus:ring-1 focus:ring-blue-800"
                                                    placeholder="Enter current password"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowOldPassword(!showOldPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-600"
                                                >
                                                    {showOldPassword ? <EyeIcon size={20} /> : <EyeOffIcon size={20} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="newPassword" className="text-blue-900 font-medium">
                                                New Password
                                            </Label>
                                            <div className="relative">
                                                <input
                                                    id="newPassword"
                                                    type={showNewPassword ? "text" : "password"}
                                                    className="w-full font-manrope text-black placeholder:text-gray-500 rounded-lg border border-gray-200 text-sm pl-3 sm:pl-5 py-2 sm:py-3 focus:outline-none focus:ring-1 focus:ring-blue-800"
                                                    placeholder="Enter new password"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-600"
                                                >
                                                    {showNewPassword ? <EyeIcon size={20} /> : <EyeOffIcon size={20} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="confirmPassword" className="text-blue-900 font-medium">
                                                Confirm New Password
                                            </Label>
                                            <div className="relative">
                                                <input
                                                    id="confirmPassword"
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    className="w-full font-manrope text-black placeholder:text-gray-500 rounded-lg border border-gray-200 text-sm pl-3 sm:pl-5 py-2 sm:py-3 focus:outline-none focus:ring-1 focus:ring-blue-800"
                                                    placeholder="Confirm new password"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-600"
                                                >
                                                    {showConfirmPassword ? <EyeIcon size={20} /> : <EyeOffIcon size={20} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        disabled={loading}
                                        className="border-[0.5px] font-semibold p-6 w-42 rounded-md border-[#c3deff] hover:bg-[#e5f1ff] bg-[#f6faff] text-[#4a516d]"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Updating Password...
                                            </>
                                        ) : (
                                            "Update Password"
                                        )}
                                    </Button>
                                </form>
                            )}

                            {activeSection === 'email' && (
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                            <Label htmlFor="email" className="text-blue-900 font-medium">Email</Label>
                                            {isEmailVerified ? (
                                                <span className="flex items-center text-green-600 text-sm">
                                                    <CheckCircle2 size={16} className="mr-1" />
                                                    Verified
                                                </span>
                                            ) : (
                                                <span className="flex items-center text-yellow-600 text-sm">
                                                    <AlertCircle size={16} className="mr-1" />
                                                    {!sendingMail ? (
                                                        <button
                                                            type="button"
                                                            onClick={handleVerifyEmail}
                                                            className="text-blue-600 hover:underline ml-1"
                                                        >
                                                            Verify now
                                                        </button>
                                                    ) : (
                                                        <span className="text-blue-600 ml-1">Sending mail...</span>
                                                    )}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <input
                                                id="email"
                                                type="email"
                                                value={currentEmail}
                                                onChange={(e) => setCurrentEmail(e.target.value)}
                                                disabled={!isEditing}
                                                className="w-full font-manrope text-black placeholder:text-gray-500 rounded-lg border border-gray-200 text-sm pl-3 sm:pl-5 py-2 sm:py-3 focus:outline-none focus:ring-1 focus:ring-blue-800"
                                                placeholder="Enter your email"
                                            />

                                            {!isEditing ? (
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => setIsEditing(true)}
                                                    className="border-blue-100 hover:border-blue-200 hover:bg-blue-50"
                                                >
                                                    <Edit2 size={18} className="text-blue-500" />
                                                </Button>
                                            ) : loading ? (
                                                <Button
                                                    disabled
                                                    variant="outline"
                                                    size="icon"
                                                    className="border-blue-100"
                                                >
                                                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={handleChangeEmail}
                                                    className="border-blue-100 hover:border-blue-200 hover:bg-blue-50"
                                                >
                                                    <Save size={18} className="text-blue-500" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications">
                    <Card className="w-full border-none shadow-lg bg-white/80 backdrop-blur-sm">
                        <CardHeader className="border-b border-blue-100/50">
                            <CardTitle className="text-2xl font-bold text-[#605DFF]">Email Management</CardTitle>
                            <p className="">Update your account email address</p>
                        </CardHeader>

                        <CardContent className="space-y-6 pt-8">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="current-email" className="text-blue-900 font-medium">
                                        Current Email
                                    </Label>
                                    <input
                                        id="current-email"
                                        type="email"
                                        value={currentEmail}
                                        disabled
                                        className="w-full font-manrope text-black placeholder:text-gray-500 rounded-lg border border-gray-200 text-sm pl-3 sm:pl-5 py-2 sm:py-3 focus:outline-none focus:ring-1 focus:ring-blue-800"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="new-email" className="text-blue-900 font-medium">
                                        New Email
                                    </Label>
                                    <input
                                        id="new-email"
                                        type="email"
                                        className="w-full font-manrope text-black placeholder:text-gray-500 rounded-lg border border-gray-200 text-sm pl-3 sm:pl-5 py-2 sm:py-3 focus:outline-none focus:ring-1 focus:ring-blue-800"
                                        placeholder="Enter new email address"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password-confirm" className="text-blue-900 font-medium">
                                        Password Confirmation
                                    </Label>
                                    <div className="relative">
                                        <input
                                            id="password-confirm"
                                            type="password"
                                            className="w-full font-manrope text-black placeholder:text-gray-500 rounded-lg border border-gray-200 text-sm pl-3 sm:pl-5 py-2 sm:py-3 focus:outline-none focus:ring-1 focus:ring-blue-800"
                                            placeholder="Enter your current password to confirm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="pt-6 pb-8">
                            <Button
                                disabled={loading}
                                className="border-[0.5px] font-semibold p-6 w-42 rounded-md border-[#c3deff] hover:bg-[#e5f1ff] bg-[#f6faff] text-[#4a516d]"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating Email...
                                    </>
                                ) : (
                                    "Update Email"
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
                <TabsContent value="appearance">
                    <Card className="w-full border-none shadow-lg bg-white/80 backdrop-blur-sm">
                        <CardHeader className="border-b border-blue-100/50">
                            <CardTitle className="text-2xl font-bold text-[#605DFF]">Appearance Settings</CardTitle>
                            <p className="">Customize the look of your application</p>
                        </CardHeader>

                        <CardContent className="space-y-8 pt-8">
                            <div className="space-y-4">
                                <Label className="text-blue-900 font-medium">Select Theme</Label>
                                <RadioGroup
                                    defaultValue={theme}
                                    onValueChange={handleThemeChange}
                                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                >
                                    <Label
                                        htmlFor="light"
                                        className={`
                    flex flex-col items-center justify-center rounded-xl border-2 p-6 
                    hover:bg-blue-50/50 cursor-pointer transition-all
                    ${theme === "light" ? "border-blue-500 bg-blue-50/30" : "border-blue-100"}
                  `}
                                    >
                                        <RadioGroupItem value="light" id="light" className="sr-only" />
                                        {/* <img
                                            src="/api/placeholder/200/100"
                                            alt="Light mode preview"
                                            className="rounded-lg shadow-md"
                                        /> */}
                                        <span className="text-blue-900 font-medium">Light Mode</span>
                                    </Label>

                                    <Label
                                        htmlFor="dark"
                                        className={`
                    flex flex-col items-center justify-center rounded-xl border-2 p-6 
                    hover:bg-blue-50/50 cursor-pointer transition-all
                    ${theme === "dark" ? "border-blue-500 bg-blue-50/30" : "border-blue-100"}
                  `}
                                    >
                                        <RadioGroupItem value="dark" id="dark" className="sr-only" />
                                        {/* <img
                                            src="/api/placeholder/200/100"
                                            alt="Dark mode preview"
                                            className="rounded-lg shadow-md"
                                        /> */}
                                        <span className="text-blue-900 font-medium">Dark Mode</span>
                                    </Label>
                                </RadioGroup>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl border border-blue-100 bg-blue-50/30">
                                <Label htmlFor="auto-switch" className="text-blue-900">
                                    Automatically switch based on system preference
                                </Label>
                                <Switch
                                    id="auto-switch"
                                    className="data-[state=checked]:bg-blue-500"
                                />
                            </div>
                        </CardContent>

                        <CardFooter className="pt-6 pb-8">
                            <Button
                                className="border-[0.5px] font-semibold p-6 w-42 rounded-md border-[#c3deff] hover:bg-[#e5f1ff] bg-[#f6faff] text-[#4a516d]"
                                onClick={() => console.log(`Theme set to: ${theme}`)}
                            >
                                Apply Theme
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default Setting;
