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
    <div className="min-h-screen bg-background p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <Logo variant="green-scholar-fund" className="h-20 w-auto mx-auto" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Green Scholar Fund</h1>
          <p className="text-muted-foreground">Empowering education through community support</p>
        </div>
      </div>

      {/* Orange Banner with white text */}
      <div className="rounded-lg p-4 md:p-5" style={{ backgroundColor: '#0B7D3B' }}>
        <div className="text-white font-semibold">100% of PET Bottles revenue goes to the Green Scholar Fund</div>
        <div className="text-white text-sm mt-1">Every PET bottle you recycle contributes directly to supporting students in need. Your environmental action creates educational opportunities!</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
          <div className="bg-white/10 rounded-md p-3">
            <div className="text-xs text-white/80">Total Community Fund</div>
            <div className="text-white text-xl font-bold">{fundLoading ? '—' : `R${Number(fundStats?.total_balance || 0).toLocaleString()}`}</div>
          </div>
          <div className="bg-white/10 rounded-md p-3">
            <div className="text-xs text-white/80">Left to Reach Monthly Goal</div>
            <div className="text-white text-xl font-bold">{fundLoading ? '—' : `R${Number(fundStats?.remaining_amount || 0).toLocaleString()}`}</div>
          </div>
          <div className="bg-white/10 rounded-md p-3">
            <div className="text-xs text-white/80">Monthly Goal</div>
            <div className="text-white text-xl font-bold">{fundLoading ? '—' : `R${monthlyGoalVal.toLocaleString()}`}</div>
          </div>
        </div>
        <div className="text-white/80 text-xs mt-3">
          Total Community Fund reflects the whole community: PET contributions (all users) + cash donations (all users) − disbursed support.
        </div>
      </div>

      {/* PET Bottles Contribution Section */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center space-x-2">
            <Heart className="h-5 w-5 text-green-600" />
            <span>Your PET Bottles Contribution</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {petBottlesSummary.totalWeight.toFixed(1)}kg
              </div>
              <div className="text-sm text-muted-foreground">Total Weight (current + future PET)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                R{petBottlesSummary.totalValue.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">PET Contribution</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                R{cashDonations.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Cash Donations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                R{totalDonation.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Total Donation</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferred School Selection */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Choose a Primary School to Benefit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
            <div>
              <Label htmlFor="preferredSchool">Primary School</Label>
              <Select onValueChange={() => {}}>
                <SelectTrigger id="preferredSchool">
                  <SelectValue placeholder="Select a school" />
                </SelectTrigger>
                <SelectContent>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Button className="w-full md:w-auto">Save Preference</Button>
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
            <Button 
              variant="gradient" 
              disabled={!donationAmount}
              onClick={() => setShowDonationDialog(true)}
            >
              Donate R{donationAmount}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Donations can be made from your Woza Mali wallet</p>
        </CardContent>
      </Card>

      {/* Donation Transactions */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Donation Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {(userDonations || []).length === 0 ? (
            <div className="text-sm text-muted-foreground">No donation transactions yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Amount</th>
                    <th className="py-2 pr-4">Beneficiary</th>
                    <th className="py-2">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {userDonations.map((d: any) => (
                    <tr key={d.id} className="border-t">
                      <td className="py-2 pr-4">{new Date(d.createdAt || d.created_at).toLocaleDateString()}</td>
                      <td className="py-2 pr-4">R {Number(d.amount || 0).toFixed(2)}</td>
                      <td className="py-2 pr-4">
                        {d.beneficiaryType === 'school' ? 'School' : d.beneficiaryType === 'child_headed_home' ? 'Child-Headed Home' : 'General Fund'}
                      </td>
                      <td className="py-2">{d.message || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
                        <div className="bg-gradient-impact h-2 rounded-full transition-all duration-500" style={{ width: `${fundedPercentage}%` }} />
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
          <p className="text-sm text-muted-foreground mb-3">If you're a learner or support a child-headed household, apply for assistance</p>
          <Dialog open={showApplication} onOpenChange={setShowApplication}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm">Apply for Support</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Green Scholar Fund Application</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {renderApplicationStep()}
                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setApplicationStep(Math.max(1, applicationStep - 1))} disabled={applicationStep === 1}>Previous</Button>
                  {applicationStep < 5 ? (
                    <Button onClick={() => setApplicationStep(applicationStep + 1)} disabled={!applicationData.fullName || !applicationData.dateOfBirth || !applicationData.phoneNumber}>Next</Button>
                  ) : (
                    <Button onClick={handleApplicationSubmit} disabled={!applicationData.fullName || !applicationData.dateOfBirth || !applicationData.phoneNumber}>Submit Application</Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Fund Information */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center space-x-2">
            <Info className="h-5 w-5 text-primary" />
            <span>About the Fund</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-foreground mb-2">Our Mission</h4>
              <p className="text-sm text-muted-foreground">The Green Scholar Fund supports learners from disadvantaged backgrounds by providing essential educational resources, including school uniforms, stationery, and nutritional support.</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">How It Works</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Community donations fund the program</li>
                <li>• Applications are reviewed monthly</li>
                <li>• Support is distributed based on need</li>
                <li>• Regular updates on fund usage</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GreenScholarFund;