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
import SchoolSearch from "@/components/SchoolSearch";
import type { School } from "@/lib/schoolsService";
import { savePreferredSchool, getPreferredSchool, clearPreferredSchool } from "@/lib/schoolsService";

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
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [preferredSchool, setPreferredSchool] = useState<School | null>(null);
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
  
  // Load current preferred school for display
  useEffect(() => {
    const loadPreferred = async () => {
      if (!user?.id) return;
      const res = await getPreferredSchool();
      if (res.data) setPreferredSchool(res.data);
    };
    loadPreferred();
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
    <div className="min-h-screen bg-gradient-warm dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 px-2 py-3 pb-24 space-y-3">
      {/* Header - Ultra Mobile Optimized */}
      <div className="text-center space-y-2 pt-2">
        <Logo variant="green-scholar-fund" className="h-24 w-auto mx-auto mb-2" />
        <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
          Green Scholar Fund
        </h1>
        <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">Empowering education through community support</p>
      </div>

      {/* Fund Status Banner - Ultra Mobile Optimized */}
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-green-600 to-green-700 dark:from-green-700 dark:to-green-800 text-white shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-300">
        <CardContent className="p-3">
          <div className="text-center mb-3">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className="p-2 bg-white/20 rounded-lg">
                <Heart className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold">100% of PET Bottles Revenue</h2>
                <p className="text-green-100 text-xs">Every bottle you recycle supports students in need</p>
              </div>
            </div>
            <p className="text-green-100 text-xs font-medium">Your environmental action creates educational opportunities!</p>
          </div>

          <div className="grid grid-cols-3 gap-1">
            <div className="text-center p-1.5 bg-white/10 rounded-lg border border-white/20">
              <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-1">
                <Wallet className="h-2.5 w-2.5" />
              </div>
              <p className="text-xs text-green-100 mb-0.5">Total Fund</p>
              <p className="text-xs font-bold">{fundLoading ? '—' : `R${Number(fundStats?.total_balance || 0).toLocaleString()}`}</p>
            </div>
            
            <div className="text-center p-1.5 bg-white/10 rounded-lg border border-white/20">
              <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-1">
                <Target className="h-2.5 w-2.5" />
              </div>
              <p className="text-xs text-green-100 mb-0.5">Left to Goal</p>
              <p className="text-xs font-bold">{fundLoading ? '—' : `R${Number(fundStats?.remaining_amount || 0).toLocaleString()}`}</p>
            </div>
            
            <div className="text-center p-1.5 bg-white/10 rounded-lg border border-white/20">
              <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-1">
                <TrendingUp className="h-2.5 w-2.5" />
              </div>
              <p className="text-xs text-green-100 mb-0.5">Monthly Goal</p>
              <p className="text-xs font-bold">{fundLoading ? '—' : `R${monthlyGoalVal.toLocaleString()}`}</p>
            </div>
          </div>

          <div className="mt-3 p-2 bg-white/5 rounded-lg border border-white/10">
            <p className="text-green-100 text-xs text-center">
              <Info className="h-3 w-3 inline mr-1" />
              Total Community Fund reflects the whole community: PET contributions + cash donations − disbursed support
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Your Contribution Overview - Compact single-line items */}
      <Card className="card-modern">
        <CardHeader className="card-modern-header p-3">
          <CardTitle className="text-sm font-bold text-white flex items-center">
            <Heart className="h-4 w-4 mr-2 text-white" />
            Your Contribution Impact
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="space-y-2">
            {/* Row 1: Total Weight and PET Contribution */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between p-2 rounded-lg border bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-700">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Target className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-xs text-green-700 dark:text-green-300 font-medium truncate">Total Weight</span>
                </div>
                <span className="text-sm font-bold text-green-700 dark:text-green-300 ml-2 flex-shrink-0">{petBottlesSummary.totalWeight.toFixed(1)}kg</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg border bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-700">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <Wallet className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-xs text-blue-700 dark:text-blue-300 font-medium truncate">PET Contribution</span>
                </div>
                <span className="text-sm font-bold text-blue-700 dark:text-blue-300 ml-2 flex-shrink-0">R{petBottlesSummary.totalValue.toFixed(2)}</span>
              </div>
            </div>

            {/* Row 2: Cash Donations and Total Impact */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between p-2 rounded-lg border bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-purple-200 dark:border-purple-700">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                    <CreditCard className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-xs text-purple-700 dark:text-purple-300 font-medium truncate">Cash Donations</span>
                </div>
                <span className="text-sm font-bold text-purple-700 dark:text-purple-300 ml-2 flex-shrink-0">R{cashDonations.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg border bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 border-yellow-200 dark:border-yellow-700">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-xs text-yellow-700 dark:text-yellow-300 font-medium truncate">Total Impact</span>
                </div>
                <span className="text-sm font-bold text-yellow-700 dark:text-yellow-300 ml-2 flex-shrink-0">R{totalDonation.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* School Selection & Donation - Ultra Mobile Optimized */}
      <div className="space-y-3">
        {/* School Selection */}
        <Card className="card-modern">
          <CardHeader className="card-modern-header p-3">
            <CardTitle className="text-sm font-bold text-white flex items-center">
              <GraduationCap className="h-4 w-4 mr-2 text-white" />
              Choose School to Benefit
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="space-y-3">
              {preferredSchool && (
                <div className="p-3 rounded-lg border border-green-200 bg-green-50 text-xs text-green-800">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-green-900">Your Beneficiary School</div>
                      <div className="mt-1">
                        <div className="font-medium">{preferredSchool.name}</div>
                        <div className="text-[11px] text-green-700">
                          {[preferredSchool.address_line1, preferredSchool.township, preferredSchool.city].filter(Boolean).join(', ') || '—'}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px] text-white"
                      onClick={async () => {
                        const res = await clearPreferredSchool();
                        if (res.ok) {
                          setPreferredSchool(null);
                          setSelectedSchool(null);
                          toast({ title: 'Removed', description: 'Your beneficiary school has been cleared.' });
                        } else {
                          const errMsg = (res.error && (res.error.message || String(res.error))) || '';
                          toast({ title: 'Error', description: `Could not remove school. ${errMsg || 'Please try again.'}` });
                        }
                      }}
                    >
                      Remove School
                    </Button>
                  </div>
                </div>
              )}
              <div className="form-group-modern">
                <Label className="form-label-modern text-xs">Primary School</Label>
                <SchoolSearch onSelect={setSelectedSchool} placeholder="Search for school name..." />
                {selectedSchool && (
                  <div className="mt-2 text-xs text-gray-300">
                    <div>
                      Selected: <span className="font-medium text-white">{selectedSchool.name}</span>
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {[selectedSchool.address_line1, selectedSchool.township, selectedSchool.city]
                        .filter(Boolean)
                        .join(', ') || '—'}
                    </div>
                  </div>
                )}
              </div>
              <Button
                className="btn-primary-yellow w-full h-8 text-xs"
                disabled={!selectedSchool || !user}
                onClick={async () => {
                  if (!selectedSchool) return;
                  const res = await savePreferredSchool(user?.id as any, selectedSchool.id);
                  if (res.ok) {
                    toast({ title: 'Saved', description: 'Your school has been saved.' });
                    // Refresh preferred card
                    try {
                      const ref = await getPreferredSchool();
                      if (ref.data) setPreferredSchool(ref.data);
                    } catch {}
                  } else {
                    const errMsg = (res.error && (res.error.message || String(res.error))) || '';
                    const friendly = errMsg.includes('NO_SESSION') || errMsg.includes('Auth session missing') || errMsg.includes('Unauthorized')
                      ? 'Please sign in again to continue.'
                      : `Could not save your school. ${errMsg || 'Please try again.'}`;
                    toast({ title: 'Error', description: friendly });
                    console.error('Save preferred school failed:', res.error);
                  }
                }}
              >
                <GraduationCap className="h-3 w-3 mr-1" />
                Save School
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Donation */}
        <Card className="card-modern">
          <CardHeader className="card-modern-header p-3">
            <CardTitle className="text-sm font-bold text-white flex items-center">
              <Heart className="h-4 w-4 mr-2 text-white" />
              Make a Donation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant={donationAmount === amount ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDonationAmount(amount)}
                    className={`h-8 text-xs ${donationAmount === amount ? 'btn-primary-yellow' : 'btn-outline-modern'}`}
                  >
                    R{amount}
                  </Button>
                ))}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customAmount" className="form-label-modern text-xs">Custom Amount</Label>
                <div className="flex space-x-2">
                  <Input
                    id="customAmount"
                    type="number"
                    placeholder="Enter amount"
                    value={donationAmount || ''}
                    onChange={(e) => setDonationAmount(Number(e.target.value))}
                    className="form-input-modern h-8 text-xs"
                  />
                  <Button 
                    className="btn-primary-yellow h-8 text-xs"
                    disabled={!donationAmount}
                    onClick={() => setShowDonationDialog(true)}
                  >
                    <Heart className="h-3 w-3 mr-1" />
                    Donate R{donationAmount}
                  </Button>
                </div>
              </div>
              
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center">
                  <Wallet className="h-3 w-3 mr-1" />
                  Donations can be made from your Woza Mali wallet
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Donation Transactions - Ultra Mobile Optimized */}
      <Card className="card-modern">
        <CardHeader className="card-modern-header p-3">
          <CardTitle className="text-sm font-bold text-white flex items-center">
            <FileText className="h-4 w-4 mr-2 text-white" />
            Donation Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          {(userDonations || []).length === 0 ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-2">
                <FileText className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">No Donations Yet</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300">Your donation history will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {userDonations.map((d: any) => (
                <div key={d.id} className="p-2 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                        <Heart className="h-3 w-3 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          R{Number(d.amount || 0).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          {d.beneficiaryType === 'school' ? 'School' : d.beneficiaryType === 'child_headed_home' ? 'Child-Headed Home' : 'General Fund'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
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

      {/* Support Categories - Ultra Mobile Optimized */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">How Your Donation Helps</h3>
        <div className="grid grid-cols-3 gap-1">
          {supportCategories.map((category, index) => {
            const Icon = category.icon;
            const totalNeeded = category.funded + category.needed;
            const fundedPercentage = (category.funded / totalNeeded) * 100;
            return (
              <Card key={index} className="card-modern hover:scale-105 transition-all duration-300">
                <CardContent className="p-2">
                  <div className="text-center mb-1">
                    <div className="w-6 h-6 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/40 rounded-lg flex items-center justify-center mx-auto mb-1">
                      <Icon className="h-3 w-3 text-green-600 dark:text-green-400" />
                    </div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white mb-0.5">{category.title}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mb-1 line-clamp-2">{category.description}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-green-600 dark:text-green-400">R{category.cost}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">per item</span>
                    </div>
                    
                    <div className="space-y-0.5">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-green-600 h-1.5 rounded-full transition-all duration-500" 
                          style={{ width: `${fundedPercentage}%` }} 
                        />
                      </div>
                      <div className="flex justify-between text-xs">
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

      {/* Application CTA & Fund Information - Ultra Mobile Optimized */}
      <div className="space-y-3">
        {/* Application CTA */}
        <Card className="card-modern border-dashed border-green-300 dark:border-green-600">
          <CardContent className="p-3 text-center">
            <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/40 rounded-full flex items-center justify-center mx-auto mb-2">
              <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Need Support?</h4>
            <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">If you're a learner or support a child-headed household, apply for assistance</p>
            <Dialog open={showApplication} onOpenChange={setShowApplication}>
              <DialogTrigger asChild>
                <Button className="btn-primary-yellow h-8 text-xs">
                  <UserCheck className="h-3 w-3 mr-1" />
                  Apply for Support
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold">Green Scholar Fund Application</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {renderApplicationStep()}
                  <div className="flex justify-between pt-3">
                    <Button 
                      className="btn-outline-modern h-8 text-xs" 
                      onClick={() => setApplicationStep(Math.max(1, applicationStep - 1))} 
                      disabled={applicationStep === 1}
                    >
                      Previous
                    </Button>
                    {applicationStep < 5 ? (
                      <Button 
                        className="btn-primary-yellow h-8 text-xs"
                        onClick={() => setApplicationStep(applicationStep + 1)} 
                        disabled={!applicationData.fullName || !applicationData.dateOfBirth || !applicationData.phoneNumber}
                      >
                        Next
                      </Button>
                    ) : (
                      <Button 
                        className="btn-primary-yellow h-8 text-xs"
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
          <CardHeader className="card-modern-header p-3">
            <CardTitle className="text-sm font-bold text-white flex items-center">
              <Info className="h-4 w-4 mr-2 text-white" />
              About the Fund
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="space-y-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center text-xs">
                  <Shield className="h-3 w-3 mr-1 text-blue-600" />
                  Our Mission
                </h4>
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  The Green Scholar Fund supports learners from disadvantaged backgrounds by providing essential educational resources, including school uniforms, stationery, and nutritional support.
                </p>
              </div>
              
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center text-xs">
                  <Clock className="h-3 w-3 mr-1 text-green-600" />
                  How It Works
                </h4>
                <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                  <li className="flex items-center">
                    <div className="w-1 h-1 bg-green-500 rounded-full mr-2"></div>
                    Community donations fund the program
                  </li>
                  <li className="flex items-center">
                    <div className="w-1 h-1 bg-green-500 rounded-full mr-2"></div>
                    Applications are reviewed monthly
                  </li>
                  <li className="flex items-center">
                    <div className="w-1 h-1 bg-green-500 rounded-full mr-2"></div>
                    Support is distributed based on need
                  </li>
                  <li className="flex items-center">
                    <div className="w-1 h-1 bg-green-500 rounded-full mr-2"></div>
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