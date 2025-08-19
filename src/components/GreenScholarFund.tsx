import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Heart, GraduationCap, Users, Target, TrendingUp, BookOpen, Shirt, Apple, AlertCircle, CheckCircle, XCircle, Info, FileText, UserCheck, Shield, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import Logo from "./Logo";

const GreenScholarFund = () => {
  const [donationAmount, setDonationAmount] = useState<number>(0);
  const [showApplication, setShowApplication] = useState(false);
  const [applicationStep, setApplicationStep] = useState(1);
  const [applicationData, setApplicationData] = useState({
    // Personal Information
    fullName: '',
    dateOfBirth: '',
    phoneNumber: '',
    email: '',
    idNumber: '',
    
    // Academic Information
    schoolName: '',
    grade: '',
    studentNumber: '',
    academicPerformance: '',
    
    // Financial Information
    householdIncome: '',
    householdSize: '',
    employmentStatus: '',
    otherIncomeSources: '',
    
    // Support Needs
    supportType: [],
    urgentNeeds: '',
    previousSupport: '',
    
    // Documentation
    hasIdDocument: false,
    hasSchoolReport: false,
    hasIncomeProof: false,
    hasBankStatement: false,
    
    // Additional Information
    specialCircumstances: '',
    communityInvolvement: '',
    references: ''
  });

  const fundStats = {
    totalRaised: 0.00,
    monthlyGoal: 50000,
    beneficiaries: 0,
    thisMonthDonations: 0.00
  };

  // User's contribution breakdown
  const userContributions = {
    petBottleContributions: 0.00, // From recycling activities
    cashDonations: 0.00, // Direct donations
    totalPersonal: 0.00
  };

  const quickAmounts = [10, 25, 50, 100];
  
  const supportCategories = [
    {
      title: "School Uniforms",
      description: "Provide school uniforms for learners in need",
      cost: 350,
      icon: Shirt,
      funded: 0,
      needed: 12
    },
    {
      title: "Stationery Packs",
      description: "Essential school supplies for students",
      cost: 120,
      icon: BookOpen,
      funded: 0,
      needed: 20
    },
    {
      title: "Nutritional Support",
      description: "Weekly food parcels for child-headed households",
      cost: 200,
      icon: Apple,
      funded: 0,
      needed: 25
    }
  ];

  // Application Criteria
  const applicationCriteria = {
    eligibility: [
      "Must be a South African citizen or permanent resident",
      "Must be enrolled in a registered educational institution",
      "Must demonstrate financial need (household income below R8,000/month)",
      "Must maintain minimum 60% academic performance",
      "Must not be receiving other substantial financial aid",
      "Must be actively involved in community service or recycling activities"
    ],
    requiredDocuments: [
      "Valid South African ID or birth certificate",
      "Current school report card",
      "Proof of household income (payslips, bank statements)",
      "Letter of recommendation from school principal",
      "Proof of community involvement",
      "Recent utility bills for address verification"
    ],
    vettingProcess: [
      "Initial application review (2-3 business days)",
      "Document verification and background checks (5-7 business days)",
      "Home visit assessment (scheduled within 1 week)",
      "Community reference verification (3-5 business days)",
      "Final committee review and decision (2-3 business days)",
      "Total processing time: 2-3 weeks"
    ],
    supportTypes: [
      "School Uniforms (R350 value)",
      "Stationery Packs (R120 value)",
      "Nutritional Support (R200/month)",
      "Transport Allowance (R150/month)",
      "Textbook Assistance (R300/semester)",
      "Extracurricular Activities (R100/month)"
    ]
  };

  const progressPercentage = (fundStats.totalRaised / fundStats.monthlyGoal) * 100;

  const handleInputChange = (field: string, value: any) => {
    setApplicationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSupportTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setApplicationData(prev => ({
        ...prev,
        supportType: [...prev.supportType, type]
      }));
    } else {
      setApplicationData(prev => ({
        ...prev,
        supportType: prev.supportType.filter(t => t !== type)
      }));
    }
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return applicationData.fullName && applicationData.dateOfBirth && applicationData.phoneNumber;
      case 2:
        return applicationData.schoolName && applicationData.grade && applicationData.academicPerformance;
      case 3:
        return applicationData.householdIncome && applicationData.householdSize;
      case 4:
        return applicationData.supportType.length > 0;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(applicationStep)) {
      setApplicationStep(prev => Math.min(prev + 1, 5));
    } else {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields before proceeding.",
        variant: "destructive",
      });
    }
  };

  const prevStep = () => {
    setApplicationStep(prev => Math.max(prev - 1, 1));
  };

  const submitApplication = async () => {
    try {
      // Here you would typically send the data to your backend
      // For now, we'll simulate the submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Application Submitted Successfully!",
        description: "Your application has been received and is under review. You'll receive updates via SMS/email.",
      });
      
      setShowApplication(false);
      setApplicationStep(1);
      setApplicationData({
        fullName: '', dateOfBirth: '', phoneNumber: '', email: '', idNumber: '',
        schoolName: '', grade: '', studentNumber: '', academicPerformance: '',
        householdIncome: '', householdSize: '', employmentStatus: '', otherIncomeSources: '',
        supportType: [], urgentNeeds: '', previousSupport: '',
        hasIdDocument: false, hasSchoolReport: false, hasIncomeProof: false, hasBankStatement: false,
        specialCircumstances: '', communityInvolvement: '', references: ''
      });
    } catch (error) {
      toast({
        title: "Application Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderApplicationStep = () => {
    switch (applicationStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={applicationData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={applicationData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  value={applicationData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={applicationData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email address"
                />
              </div>
              <div>
                <Label htmlFor="idNumber">ID Number</Label>
                <Input
                  id="idNumber"
                  value={applicationData.idNumber}
                  onChange={(e) => handleInputChange('idNumber', e.target.value)}
                  placeholder="Enter your ID number"
                />
              </div>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center mb-4">Academic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="schoolName">School Name *</Label>
                <Input
                  id="schoolName"
                  value={applicationData.schoolName}
                  onChange={(e) => handleInputChange('schoolName', e.target.value)}
                  placeholder="Enter your school name"
                />
              </div>
              <div>
                <Label htmlFor="grade">Current Grade *</Label>
                <Select value={applicationData.grade} onValueChange={(value) => handleInputChange('grade', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({length: 12}, (_, i) => i + 1).map(grade => (
                      <SelectItem key={grade} value={grade.toString()}>Grade {grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="studentNumber">Student Number</Label>
                <Input
                  id="studentNumber"
                  value={applicationData.studentNumber}
                  onChange={(e) => handleInputChange('studentNumber', e.target.value)}
                  placeholder="Enter your student number"
                />
              </div>
              <div>
                <Label htmlFor="academicPerformance">Academic Performance *</Label>
                <Select value={applicationData.academicPerformance} onValueChange={(value) => handleInputChange('academicPerformance', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select performance level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent (80%+)</SelectItem>
                    <SelectItem value="good">Good (70-79%)</SelectItem>
                    <SelectItem value="average">Average (60-69%)</SelectItem>
                    <SelectItem value="below_average">Below Average (50-59%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center mb-4">Financial Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="householdIncome">Monthly Household Income *</Label>
                <Select value={applicationData.householdIncome} onValueChange={(value) => handleInputChange('householdIncome', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select income range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-2000">R0 - R2,000</SelectItem>
                    <SelectItem value="2001-4000">R2,001 - R4,000</SelectItem>
                    <SelectItem value="4001-6000">R4,001 - R6,000</SelectItem>
                    <SelectItem value="6001-8000">R6,001 - R8,000</SelectItem>
                    <SelectItem value="8001+">Above R8,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="householdSize">Household Size *</Label>
                <Select value={applicationData.householdSize} onValueChange={(value) => handleInputChange('householdSize', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select household size" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({length: 10}, (_, i) => i + 1).map(size => (
                      <SelectItem key={size} value={size.toString()}>{size} person{size > 1 ? 's' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="employmentStatus">Employment Status</Label>
                <Select value={applicationData.employmentStatus} onValueChange={(value) => handleInputChange('employmentStatus', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employed">Employed Full-time</SelectItem>
                    <SelectItem value="part_time">Employed Part-time</SelectItem>
                    <SelectItem value="unemployed">Unemployed</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="otherIncomeSources">Other Income Sources</Label>
                <Input
                  id="otherIncomeSources"
                  value={applicationData.otherIncomeSources}
                  onChange={(e) => handleInputChange('otherIncomeSources', e.target.value)}
                  placeholder="e.g., grants, pensions, etc."
                />
              </div>
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center mb-4">Support Needs</h3>
            <div className="space-y-4">
              <div>
                <Label>What type of support do you need? *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  {applicationCriteria.supportTypes.map((type, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Checkbox
                        id={`support-${index}`}
                        checked={applicationData.supportType.includes(type)}
                        onCheckedChange={(checked) => handleSupportTypeChange(type, checked as boolean)}
                      />
                      <Label htmlFor={`support-${index}`} className="text-sm">{type}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="urgentNeeds">Urgent Needs</Label>
                <Textarea
                  id="urgentNeeds"
                  value={applicationData.urgentNeeds}
                  onChange={(e) => handleInputChange('urgentNeeds', e.target.value)}
                  placeholder="Describe any urgent needs or emergency situations..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="previousSupport">Previous Support Received</Label>
                <Textarea
                  id="previousSupport"
                  value={applicationData.previousSupport}
                  onChange={(e) => handleInputChange('previousSupport', e.target.value)}
                  placeholder="Have you received support from other organizations before?"
                  rows={3}
                />
              </div>
            </div>
          </div>
        );
      
      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center mb-4">Documentation & Final Details</h3>
            <div className="space-y-4">
              <div>
                <Label>Required Documents (Please confirm you have these ready)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasIdDocument"
                      checked={applicationData.hasIdDocument}
                      onCheckedChange={(checked) => handleInputChange('hasIdDocument', checked)}
                    />
                    <Label htmlFor="hasIdDocument" className="text-sm">ID Document or Birth Certificate</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasSchoolReport"
                      checked={applicationData.hasSchoolReport}
                      onCheckedChange={(checked) => handleInputChange('hasSchoolReport', checked)}
                    />
                    <Label htmlFor="hasSchoolReport" className="text-sm">Current School Report</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasIncomeProof"
                      checked={applicationData.hasIncomeProof}
                      onCheckedChange={(checked) => handleInputChange('hasIncomeProof', checked)}
                    />
                    <Label htmlFor="hasIncomeProof" className="text-sm">Proof of Income</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasBankStatement"
                      checked={applicationData.hasBankStatement}
                      onCheckedChange={(checked) => handleInputChange('hasBankStatement', checked)}
                    />
                    <Label htmlFor="hasBankStatement" className="text-sm">Bank Statement</Label>
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="specialCircumstances">Special Circumstances</Label>
                <Textarea
                  id="specialCircumstances"
                  value={applicationData.specialCircumstances}
                  onChange={(e) => handleInputChange('specialCircumstances', e.target.value)}
                  placeholder="Any special circumstances we should know about..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="communityInvolvement">Community Involvement</Label>
                <Textarea
                  id="communityInvolvement"
                  value={applicationData.communityInvolvement}
                  onChange={(e) => handleInputChange('communityInvolvement', e.target.value)}
                  placeholder="Describe your involvement in community service, recycling, or other activities..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="references">References</Label>
                <Textarea
                  id="references"
                  value={applicationData.references}
                  onChange={(e) => handleInputChange('references', e.target.value)}
                  placeholder="Names and contact details of people who can vouch for you..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="pb-20 p-4 space-y-6 bg-gradient-warm min-h-screen">
      {/* Header */}
      <div className="text-center space-y-3 pt-4">
        <div className="flex justify-center">
          <Logo className="h-24 w-auto" alt="Green Scholar Fund Logo" variant="green-scholar-fund" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Green Scholar Fund</h1>
        <p className="text-muted-foreground">Supporting education through community impact</p>
      </div>

      {/* Fund Overview */}
      <Card className="bg-gradient-impact text-success-foreground shadow-warm border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm opacity-90 mb-1">Total Fund Balance</p>
              <p className="text-3xl font-bold">R {fundStats.totalRaised.toLocaleString()}</p>
            </div>
            <GraduationCap className="h-12 w-12 opacity-80" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="opacity-75">This Month</p>
              <p className="font-semibold">R {fundStats.thisMonthDonations.toLocaleString()}</p>
            </div>
            <div>
              <p className="opacity-75">Beneficiaries</p>
              <p className="font-semibold">{fundStats.beneficiaries} learners</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Contribution Breakdown */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Your Contributions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-success/10 rounded-lg">
              <p className="text-sm text-muted-foreground">PET Contributions</p>
              <p className="text-lg font-bold text-success">R {userContributions.petBottleContributions.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">From recycling</p>
            </div>
            <div className="text-center p-3 bg-primary/10 rounded-lg">
              <p className="text-sm text-muted-foreground">Cash Donations</p>
              <p className="text-lg font-bold text-primary">R {userContributions.cashDonations.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Direct donations</p>
            </div>
          </div>
          <div className="text-center p-3 bg-gradient-primary text-primary-foreground rounded-lg">
            <p className="text-sm opacity-90">Total Personal Impact</p>
            <p className="text-xl font-bold">R {userContributions.totalPersonal.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Goal Progress */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Monthly Goal Progress</CardTitle>
            <Badge variant="outline">{progressPercentage.toFixed(0)}%</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="w-full bg-muted rounded-full h-3">
              <div 
                className="bg-gradient-primary h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">R {fundStats.totalRaised.toLocaleString()}</span>
              <span className="font-medium">R {fundStats.monthlyGoal.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Donation */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center space-x-2">
            <Heart className="h-5 w-5 text-primary" />
            <span>Make a Donation</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {quickAmounts.map((amount) => (
              <Button
                key={amount}
                variant={donationAmount === amount ? "default" : "outline"}
                size="sm"
                onClick={() => setDonationAmount(amount)}
                className="text-xs"
              >
                R{amount}
              </Button>
            ))}
          </div>
          
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Custom amount"
              value={donationAmount || ''}
              onChange={(e) => setDonationAmount(Number(e.target.value))}
              className="flex-1 px-3 py-2 border border-border rounded-md text-sm"
            />
            <Button variant="gradient" disabled={!donationAmount}>
              Donate R{donationAmount}
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Donations can be made from your Woza Mali wallet or MTN MoMo
          </p>
        </CardContent>
      </Card>

      {/* Support Categories */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">How Your Donation Helps</h3>
        
        {supportCategories.map((category, index) => {
          const Icon = category.icon;
          const totalNeeded = category.funded + category.needed;
          const fundedPercentage = (category.funded / totalNeeded) * 100;
          
          return (
            <Card key={index} className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-gradient-primary rounded-lg">
                    <Icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-foreground">{category.title}</h4>
                      <span className="text-sm font-bold text-primary">R{category.cost}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{category.description}</p>
                    
                    <div className="space-y-2">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-gradient-impact h-2 rounded-full transition-all duration-500"
                          style={{ width: `${fundedPercentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-success">{category.funded} funded</span>
                        <span className="text-muted-foreground">{category.needed} still needed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Application CTA */}
      <Card className="shadow-card border-secondary/20 bg-secondary/10">
        <CardContent className="p-4 text-center">
          <Users className="h-8 w-8 text-secondary mx-auto mb-2" />
          <h4 className="font-medium text-foreground mb-1">Need Support?</h4>
          <p className="text-sm text-muted-foreground mb-3">
            If you're a learner or support a child-headed household, apply for assistance
          </p>
          <Dialog open={showApplication} onOpenChange={setShowApplication}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm">
                Apply for Support
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-center">Green Scholar Fund Application</DialogTitle>
              </DialogHeader>
              
              {/* Progress Indicator */}
              <div className="flex items-center justify-between mb-6">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step < applicationStep 
                        ? 'bg-green-500 text-white' 
                        : step === applicationStep 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {step < applicationStep ? <CheckCircle className="h-4 w-4" /> : step}
                    </div>
                    {step < 5 && (
                      <div className={`w-12 h-1 mx-2 ${
                        step < applicationStep ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Application Form */}
              <div className="space-y-6">
                {renderApplicationStep()}
                
                {/* Navigation Buttons */}
                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    disabled={applicationStep === 1}
                  >
                    Previous
                  </Button>
                  
                  {applicationStep < 5 ? (
                    <Button onClick={nextStep}>
                      Next
                    </Button>
                  ) : (
                    <Button onClick={submitApplication} className="bg-green-600 hover:bg-green-700">
                      Submit Application
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Application Criteria Information */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center space-x-2">
            <FileText className="h-5 w-5 text-primary" />
            <span>Application Criteria & Process</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Eligibility Criteria */}
          <div>
            <h4 className="font-medium text-foreground mb-3 flex items-center space-x-2">
              <UserCheck className="h-4 w-4 text-green-600" />
              <span>Eligibility Criteria</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {applicationCriteria.eligibility.map((criterion, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{criterion}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Required Documents */}
          <div>
            <h4 className="font-medium text-foreground mb-3 flex items-center space-x-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span>Required Documents</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {applicationCriteria.requiredDocuments.map((document, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{document}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Vetting Process */}
          <div>
            <h4 className="font-medium text-foreground mb-3 flex items-center space-x-2">
              <Shield className="h-4 w-4 text-purple-600" />
              <span>Vetting Process</span>
            </h4>
            <div className="space-y-3">
              {applicationCriteria.vettingProcess.map((step, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Support Types */}
          <div>
            <h4 className="font-medium text-foreground mb-3 flex items-center space-x-2">
              <Target className="h-4 w-4 text-orange-600" />
              <span>Available Support Types</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {applicationCriteria.supportTypes.map((type, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <TrendingUp className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{type}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-2">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Important Notes:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Applications are reviewed on a first-come, first-served basis</li>
                  <li>Priority is given to child-headed households and orphaned learners</li>
                  <li>All information provided is kept confidential and secure</li>
                  <li>Successful applicants may be required to participate in community service</li>
                  <li>Support is renewable based on continued eligibility and performance</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GreenScholarFund;