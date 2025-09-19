import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Heart, GraduationCap, Users, Target, TrendingUp, BookOpen, Shirt, Apple, AlertCircle, CheckCircle, XCircle, Info, FileText, UserCheck, Shield, Clock, Wallet, CreditCard, Smartphone } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import Logo from "./Logo";
import { useAuth } from "@/contexts/AuthContext";
import { useGreenScholarFund } from "@/hooks/useGreenScholarFund";
import { BottleCollection } from "@/lib/greenScholarFundService";
import { PetBottlesGreenScholarIntegration } from "@/lib/petBottlesGreenScholarIntegration";

interface ApplicationData {
  // Personal Information
  fullName: string;
  dateOfBirth: string;
  phoneNumber: string;
  email: string;
  idNumber: string;
  
  // Academic Information
  schoolName: string;
  grade: string;
  studentNumber: string;
  academicPerformance: string;
  
  // Financial Information
  householdIncome: string;
  householdSize: string;
  employmentStatus: string;
  otherIncomeSources: string;
  
  // Support Needs
  supportType: string[];
  urgentNeeds: string;
  previousSupport: string;
  
  // Documentation
  hasIdDocument: boolean;
  hasSchoolReport: boolean;
  hasIncomeProof: boolean;
  hasBankStatement: boolean;
  
  // Additional Information
  specialCircumstances: string;
  communityInvolvement: string;
  references_info: string;
}

const GreenScholarFund = () => {
  const { user } = useAuth();
  const {
    fundStats,
    userBottleContributions,
    userDonations,
    userBottleCollections,
    loading: fundLoading,
    submitBottleCollection,
    submitDonation,
    submitApplication
  } = useGreenScholarFund();

  // State for PET Bottles contribution summary
  const [petBottlesSummary, setPetBottlesSummary] = useState({
    totalBottles: 0,
    totalWeight: 0,
    totalValue: 0,
    totalContributions: 0
  });

  // Fetch PET Bottles summary on component mount
  useEffect(() => {
    const fetchPetBottlesSummary = async () => {
      if (user?.id) {
        try {
          const summary = await PetBottlesGreenScholarIntegration.getUserPetBottlesSummary(user.id);
          setPetBottlesSummary(summary);
        } catch (error) {
          console.error('Error fetching PET Bottles summary:', error);
        }
      }
    };

    fetchPetBottlesSummary();
  }, [user?.id]);
  
  const [donationAmount, setDonationAmount] = useState<number>(0);
  const [showApplication, setShowApplication] = useState(false);
  const [showDonationDialog, setShowDonationDialog] = useState(false);
  const [showBottleCollectionDialog, setShowBottleCollectionDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'mtn-momo' | null>(null);
  const [isProcessingDonation, setIsProcessingDonation] = useState(false);
  const [isProcessingBottleCollection, setIsProcessingBottleCollection] = useState(false);
  const [applicationStep, setApplicationStep] = useState(1);
  const [bottleCollectionData, setBottleCollectionData] = useState({
    bottle_count: 0,
    weight_kg: 0,
    bottle_type: 'PET' as 'PET' | 'HDPE' | 'Other',
    collection_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [applicationData, setApplicationData] = useState<ApplicationData>({
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
    supportType: [] as string[],
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
    references_info: ''
  });



  // User's contribution breakdown
  const userContributions = {
    petBottleContributions: 0.00, // From recycling activities
    cashDonations: 0.00, // Direct donations
    totalPersonal: 0.00
  };

  // Compute user's cash donations total (completed only)
  const cashDonations = (userDonations || [])
    .filter((d: any) => (d.status || 'completed') === 'completed')
    .reduce((sum: number, d: any) => sum + (Number(d.amount) || 0), 0);

  // Total Donation = PET Contribution + Cash Donations
  const totalDonation = (Number(petBottlesSummary.totalValue) || 0) + (Number(cashDonations) || 0);
  const monthlyGoalVal = Number((fundStats as any)?.monthly_goal || 50000);

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
    supportTypes: [
      "School Uniforms",
      "Stationery Packs", 
      "Nutritional Support",
      "Transportation",
      "Textbooks",
      "Extracurricular Activities"
    ],
    requirements: [
      "South African ID or birth certificate",
      "Proof of school enrollment",
      "Recent school report",
      "Proof of household income",
      "Bank statements (last 3 months)"
    ]
  };

  // Handle bottle collection submission
  const handleBottleCollection = async () => {
    if (!bottleCollectionData.bottle_count || !bottleCollectionData.weight_kg) {
      toast({
        title: "Invalid Data",
        description: "Please enter valid bottle count and weight.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingBottleCollection(true);

    try {
      const result = await submitBottleCollection({
        bottle_count: bottleCollectionData.bottle_count,
        weight_kg: bottleCollectionData.weight_kg,
        bottle_type: bottleCollectionData.bottle_type,
        collection_date: bottleCollectionData.collection_date,
        notes: bottleCollectionData.notes
      });

      if (result.success) {
        // Reset form and show success
        setBottleCollectionData({
          bottle_count: 0,
          weight_kg: 0,
          bottle_type: 'PET',
          collection_date: new Date().toISOString().split('T')[0],
          notes: ''
        });
        setShowBottleCollectionDialog(false);
        
        toast({
          title: "Collection Submitted!",
          description: `Your collection of ${bottleCollectionData.bottle_count} bottles (${bottleCollectionData.weight_kg}kg) has been submitted.`,
          variant: "default",
        });
      } else {
        throw new Error(result.error || 'Collection submission failed');
      }

    } catch (error) {
      console.error('Bottle collection error:', error);
      toast({
        title: "Collection Failed",
        description: "There was an error submitting your collection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingBottleCollection(false);
    }
  };

  // Handle donation processing
  const handleDonation = async () => {
    if (!donationAmount || donationAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid donation amount.",
        variant: "destructive",
      });
      return;
    }

    if (!paymentMethod) {
      toast({
        title: "Payment Method Required",
        description: "Please select a payment method.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingDonation(true);

    try {
      // Submit donation to database
      const result = await submitDonation({
        amount: donationAmount,
        payment_method: paymentMethod,
        transaction_reference: `GSF_${Date.now()}`
      });

      if (result.success) {
        // Store amount for success message before resetting
        const successfulAmount = donationAmount;
        
        // Reset form and show success
        setDonationAmount(0);
        setPaymentMethod(null);
        setShowDonationDialog(false);
        
        toast({
          title: "Donation Successful!",
          description: `Thank you for your R${successfulAmount} donation to the Green Scholar Fund.`,
          variant: "default",
        });
      } else {
        throw new Error(result.error || 'Donation failed');
      }

    } catch (error) {
      console.error('Donation error:', error);
      toast({
        title: "Donation Failed",
        description: "There was an error processing your donation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingDonation(false);
    }
  };



  // Handle input changes for application form
  const handleInputChange = <K extends keyof ApplicationData>(
    field: K, 
    value: ApplicationData[K]
  ) => {
    setApplicationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle application submission
  const handleApplicationSubmit = async () => {
    try {
      const result = await submitApplication({
        full_name: applicationData.fullName,
        date_of_birth: applicationData.dateOfBirth,
        phone_number: applicationData.phoneNumber,
        email: applicationData.email,
        id_number: applicationData.idNumber,
        school_name: applicationData.schoolName,
        grade: applicationData.grade,
        student_number: applicationData.studentNumber,
        academic_performance: applicationData.academicPerformance,
        household_income: applicationData.householdIncome,
        household_size: applicationData.householdSize,
        employment_status: applicationData.employmentStatus,
        other_income_sources: applicationData.otherIncomeSources,
        support_type: applicationData.supportType,
        urgent_needs: applicationData.urgentNeeds,
        previous_support: applicationData.previousSupport,
        has_id_document: applicationData.hasIdDocument,
        has_school_report: applicationData.hasSchoolReport,
        has_income_proof: applicationData.hasIncomeProof,
        has_bank_statement: applicationData.hasBankStatement,
        special_circumstances: applicationData.specialCircumstances,
        community_involvement: applicationData.communityInvolvement,
        references_info: applicationData.references_info
      });

      if (result.success) {
        toast({
          title: "Application Submitted",
          description: "Your application has been submitted successfully. We'll review it and get back to you soon.",
          variant: "default",
        });
        
        setShowApplication(false);
        setApplicationStep(1);
        setApplicationData({
          fullName: '', dateOfBirth: '', phoneNumber: '', email: '', idNumber: '',
          schoolName: '', grade: '', studentNumber: '', academicPerformance: '',
          householdIncome: '', householdSize: '', employmentStatus: '', otherIncomeSources: '',
          supportType: [] as string[], urgentNeeds: '', previousSupport: '',
          hasIdDocument: false, hasSchoolReport: false, hasIncomeProof: false, hasBankStatement: false,
          specialCircumstances: '', communityInvolvement: '', references_info: ''
        });
      } else {
        throw new Error(result.error || 'Application submission failed');
      }
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
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-center mb-6 text-gray-900 dark:text-white">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group-modern">
                <Label htmlFor="fullName" className="form-label-modern">Full Name *</Label>
                <Input
                  id="fullName"
                  value={applicationData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Enter your full name"
                  className="form-input-modern"
                />
              </div>
              <div className="form-group-modern">
                <Label htmlFor="dateOfBirth" className="form-label-modern">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={applicationData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className="form-input-modern"
                />
              </div>
              <div className="form-group-modern">
                <Label htmlFor="phoneNumber" className="form-label-modern">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  value={applicationData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder="Enter your phone number"
                  className="form-input-modern"
                />
              </div>
              <div className="form-group-modern">
                <Label htmlFor="email" className="form-label-modern">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={applicationData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email address"
                  className="form-input-modern"
                />
              </div>
              <div className="form-group-modern md:col-span-2">
                <Label htmlFor="idNumber" className="form-label-modern">ID Number</Label>
                <Input
                  id="idNumber"
                  value={applicationData.idNumber}
                  onChange={(e) => handleInputChange('idNumber', e.target.value)}
                  placeholder="Enter your ID number"
                  className="form-input-modern"
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
                        onCheckedChange={(checked) => {
                          if (checked === true) {
                            handleInputChange('supportType', [...applicationData.supportType, type]);
                          } else {
                            handleInputChange('supportType', applicationData.supportType.filter(t => t !== type));
                          }
                        }}
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
                  placeholder="Describe any urgent needs or immediate challenges"
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
            <h3 className="text-lg font-semibold text-center mb-4">Documentation</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasIdDocument"
                    checked={applicationData.hasIdDocument}
                    onCheckedChange={(checked) => handleInputChange('hasIdDocument', checked === true)}
                  />
                  <Label htmlFor="hasIdDocument">I have my ID document or birth certificate</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasSchoolReport"
                    checked={applicationData.hasSchoolReport}
                    onCheckedChange={(checked) => handleInputChange('hasSchoolReport', checked === true)}
                  />
                  <Label htmlFor="hasSchoolReport">I have my recent school report</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasIncomeProof"
                    checked={applicationData.hasIncomeProof}
                    onCheckedChange={(checked) => handleInputChange('hasIncomeProof', checked === true)}
                  />
                  <Label htmlFor="hasIncomeProof">I have proof of household income</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasBankStatement"
                    checked={applicationData.hasBankStatement}
                    onCheckedChange={(checked) => handleInputChange('hasBankStatement', checked === true)}
                  />
                  <Label htmlFor="hasBankStatement">I have bank statements (last 3 months)</Label>
                </div>
              </div>
              
              <div>
                <Label htmlFor="specialCircumstances">Special Circumstances</Label>
                <Textarea
                  id="specialCircumstances"
                  value={applicationData.specialCircumstances}
                  onChange={(e) => handleInputChange('specialCircumstances', e.target.value)}
                  placeholder="Any special circumstances we should know about?"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="communityInvolvement">Community Involvement</Label>
                <Textarea
                  id="communityInvolvement"
                  value={applicationData.communityInvolvement}
                  onChange={(e) => handleInputChange('communityInvolvement', e.target.value)}
                  placeholder="How are you involved in your community?"
                  rows={3}
                />
              </div>
              
              <div>
                        <Label htmlFor="references_info">References</Label>
        <Textarea
          id="references_info"
          value={applicationData.references_info}
          onChange={(e) => handleInputChange('references_info', e.target.value)}
                  placeholder="Names and contact details of people who can vouch for you"
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
    <div className="min-h-screen bg-gradient-warm dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 p-4 pb-24 space-y-6">
      {/* Header */}
      <div className="text-center space-y-6 pt-6">
        <div className="flex justify-between items-start">
          <div className="flex-1"></div>
          <div className="flex-1 text-center">
            <Logo variant="green-scholar-fund" className="h-24 w-auto mx-auto mb-4" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              Green Scholar Fund
            </h1>
            <p className="text-gray-600 dark:text-gray-300 font-medium">Empowering education through community support</p>
          </div>
          <div className="flex justify-end flex-1">
            {/* Theme follows browser preference automatically */}
          </div>
        </div>
      </div>

      {/* Fund Status Banner - Beautiful Design */}
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-green-600 to-green-700 dark:from-green-700 dark:to-green-800 text-white shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-300">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="p-3 bg-white/20 rounded-2xl">
                <Heart className="h-8 w-8" />
              </div>
        <div>
                <h2 className="text-2xl font-bold">100% of PET Bottles Revenue</h2>
                <p className="text-green-100 text-sm">Every bottle you recycle supports students in need</p>
        </div>
            </div>
            <p className="text-green-100 text-lg font-medium">Your environmental action creates educational opportunities!</p>
      </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white/10 rounded-2xl border border-white/20">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="h-8 w-8" />
          </div>
              <p className="text-sm text-green-100 mb-2">Total Community Fund</p>
              <p className="text-3xl font-bold">{fundLoading ? '—' : `R${Number(fundStats?.total_balance || 0).toLocaleString()}`}</p>
          </div>
            
            <div className="text-center p-6 bg-white/10 rounded-2xl border border-white/20">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8" />
          </div>
              <p className="text-sm text-green-100 mb-2">Left to Reach Goal</p>
              <p className="text-3xl font-bold">{fundLoading ? '—' : `R${Number(fundStats?.remaining_amount || 0).toLocaleString()}`}</p>
        </div>
            
            <div className="text-center p-6 bg-white/10 rounded-2xl border border-white/20">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8" />
              </div>
              <p className="text-sm text-green-100 mb-2">Monthly Goal</p>
              <p className="text-3xl font-bold">{fundLoading ? '—' : `R${monthlyGoalVal.toLocaleString()}`}</p>
        </div>
      </div>

          <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
            <p className="text-green-100 text-sm text-center">
              <Info className="h-4 w-4 inline mr-2" />
              Total Community Fund reflects the whole community: PET contributions + cash donations − disbursed support
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Your Contribution Overview */}
      <Card className="card-modern">
        <CardHeader className="card-modern-header">
          <CardTitle className="text-xl font-bold text-white flex items-center">
            <Heart className="h-6 w-6 mr-3 text-white" />
            Your Contribution Impact
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-2xl border border-green-200 dark:border-green-700">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-white" />
              </div>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {petBottlesSummary.totalWeight.toFixed(1)}kg
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 font-medium">Total Weight</p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">Current + Future PET</p>
              </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-2xl border border-blue-200 dark:border-blue-700">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="h-8 w-8 text-white" />
            </div>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                R{petBottlesSummary.totalValue.toFixed(2)}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">PET Contribution</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">From Recycling</p>
              </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-2xl border border-purple-200 dark:border-purple-700">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-white" />
            </div>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                R{cashDonations.toFixed(2)}
              </p>
              <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">Cash Donations</p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Direct Support</p>
              </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-2xl border border-yellow-200 dark:border-yellow-700">
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-white" />
            </div>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                R{totalDonation.toFixed(2)}
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">Total Impact</p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Combined Contribution</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* School Selection & Donation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* School Selection */}
        <Card className="card-modern">
          <CardHeader className="card-modern-header">
            <CardTitle className="text-xl font-bold text-white flex items-center">
              <GraduationCap className="h-6 w-6 mr-3 text-white" />
              Choose School to Benefit
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="form-group-modern">
                <Label htmlFor="preferredSchool" className="form-label-modern">Primary School</Label>
              <Select onValueChange={() => {}}>
                  <SelectTrigger id="preferredSchool" className="form-input-modern">
                  <SelectValue placeholder="Select a school" />
                </SelectTrigger>
                <SelectContent>
                </SelectContent>
              </Select>
            </div>
              <Button className="btn-primary-yellow w-full">
                <GraduationCap className="h-5 w-5 mr-2" />
                Save Preference
              </Button>
          </div>
        </CardContent>
      </Card>

        {/* Quick Donation */}
        <Card className="card-modern">
          <CardHeader className="card-modern-header">
            <CardTitle className="text-xl font-bold text-white flex items-center">
              <Heart className="h-6 w-6 mr-3 text-white" />
              Make a Donation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
            {quickAmounts.map((amount) => (
              <Button
                key={amount}
                variant={donationAmount === amount ? "default" : "outline"}
                size="sm"
                onClick={() => setDonationAmount(amount)}
                    className={donationAmount === amount ? 'btn-primary-yellow' : 'btn-outline-modern'}
              >
                R{amount}
              </Button>
            ))}
          </div>
              
              <div className="space-y-3">
                <Label htmlFor="customAmount" className="form-label-modern">Custom Amount</Label>
                <div className="flex space-x-3">
                  <Input
                    id="customAmount"
              type="number"
                    placeholder="Enter amount"
              value={donationAmount || ''}
              onChange={(e) => setDonationAmount(Number(e.target.value))}
                    className="form-input-modern"
            />
            <Button 
                    className="btn-primary-yellow"
              disabled={!donationAmount}
              onClick={() => setShowDonationDialog(true)}
            >
                    <Heart className="h-5 w-5 mr-2" />
              Donate R{donationAmount}
            </Button>
          </div>
              </div>
              
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
                <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center">
                  <Wallet className="h-4 w-4 mr-2" />
                  Donations can be made from your Woza Mali wallet
                </p>
              </div>
            </div>
        </CardContent>
      </Card>
      </div>

      {/* Donation Transactions */}
      <Card className="card-modern">
        <CardHeader className="card-modern-header">
          <CardTitle className="text-xl font-bold text-white flex items-center">
            <FileText className="h-6 w-6 mr-3 text-white" />
            Donation Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {(userDonations || []).length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Donations Yet</h3>
              <p className="text-gray-600 dark:text-gray-300">Your donation history will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
                  {userDonations.map((d: any) => (
                <div key={d.id} className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                        <Heart className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          R{Number(d.amount || 0).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                        {d.beneficiaryType === 'school' ? 'School' : d.beneficiaryType === 'child_headed_home' ? 'Child-Headed Home' : 'General Fund'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(d.createdAt || d.created_at).toLocaleDateString()}
                      </p>
                      {d.message && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{d.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Support Categories */}
      <div className="space-y-6">
        <h3 className="section-title-modern">How Your Donation Helps</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {supportCategories.map((category, index) => {
          const Icon = category.icon;
          const totalNeeded = category.funded + category.needed;
          const fundedPercentage = (category.funded / totalNeeded) * 100;
          return (
              <Card key={index} className="card-modern hover:scale-105 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{category.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{category.description}</p>
                    </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-green-600 dark:text-green-400">R{category.cost}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">per item</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500" 
                          style={{ width: `${fundedPercentage}%` }} 
                        />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600 dark:text-green-400 font-medium">{category.funded} funded</span>
                        <span className="text-gray-500 dark:text-gray-400">{category.needed} needed</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        </div>
      </div>

      {/* Application CTA & Fund Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application CTA */}
        <Card className="card-modern border-dashed border-green-300 dark:border-green-600">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Need Support?</h4>
            <p className="text-gray-600 dark:text-gray-300 mb-6">If you're a learner or support a child-headed household, apply for assistance</p>
            <Dialog open={showApplication} onOpenChange={setShowApplication}>
              <DialogTrigger asChild>
                <Button className="btn-primary-yellow">
                  <UserCheck className="h-5 w-5 mr-2" />
                  Apply for Support
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">Green Scholar Fund Application</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {renderApplicationStep()}
                  <div className="flex justify-between pt-4">
                    <Button 
                      className="btn-outline-modern" 
                      onClick={() => setApplicationStep(Math.max(1, applicationStep - 1))} 
                      disabled={applicationStep === 1}
                    >
                      Previous
                    </Button>
                    {applicationStep < 5 ? (
                      <Button 
                        className="btn-primary-yellow"
                        onClick={() => setApplicationStep(applicationStep + 1)} 
                        disabled={!applicationData.fullName || !applicationData.dateOfBirth || !applicationData.phoneNumber}
                      >
                        Next
                      </Button>
                    ) : (
                      <Button 
                        className="btn-primary-yellow"
                        onClick={handleApplicationSubmit} 
                        disabled={!applicationData.fullName || !applicationData.dateOfBirth || !applicationData.phoneNumber}
                      >
                        Submit Application
                      </Button>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Fund Information */}
        <Card className="card-modern">
          <CardHeader className="card-modern-header">
            <CardTitle className="text-xl font-bold text-white flex items-center">
              <Info className="h-6 w-6 mr-3 text-white" />
              About the Fund
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-blue-600" />
                  Our Mission
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  The Green Scholar Fund supports learners from disadvantaged backgrounds by providing essential educational resources, including school uniforms, stationery, and nutritional support.
                </p>
              </div>
              
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-700">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-green-600" />
                  How It Works
                </h4>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    Community donations fund the program
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    Applications are reviewed monthly
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    Support is distributed based on need
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    Regular updates on fund usage
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GreenScholarFund;