import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Search, Users, Calendar, DollarSign, Shield, HelpCircle } from 'lucide-react';

interface FAQModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const faqSections = [
  {
    title: "Employee Questions",
    icon: Users,
    questions: [
      {
        question: "Will my employees still have a job?",
        answer: "Yes. We plan to hire as many legally eligible employees that fit within our operating model as we can because we do not have a bench of employees to drop into a business. We would expect at least 75% of the employees are eligible to work and can be hired by Big Brand to maintain operations post-close. Continued employment will be based on performance."
      },
      {
        question: "When can I tell my employees about the deal?",
        answer: "Once the Asset Purchase Agreement is signed, Big Brand will partner with you to deliver the message to your employees. This typically occurs in the final stage of the deal."
      },
      {
        question: "What happens to PTO that has been earned by my employees this year?",
        answer: "Accrued PTO is considered a liability on the business and therefore it is the seller's responsibility to fulfill the obligations of the PTO. PTO will be paid out by the Seller with the last paycheck prior to Closing."
      },
      {
        question: "Will you honor already scheduled PTO?",
        answer: "Yes. Big Brand will honor any scheduled PTO by employees. Employee PTO balances can go negative up to 40 hours. Employees will begin accruing PTO on Day 1 post-close."
      }
    ]
  },
  {
    title: "Transaction Timeline",
    icon: Calendar,
    questions: [
      {
        question: "When will the transaction be funded?",
        answer: "The transaction is funded on the day of Closing or the day after depending on when signatures are received. If signatures are received before the wiring deadline (4:30pm EST) the funds will be transferred the day of Closing. If they are received after the deadline, the funds will be wired the following day."
      },
      {
        question: "What happens between signing the APA and Close?",
        answer: "There are a few Pre-Closing Activities that occur between signing the APA and Close which include the announcement, an inventory count, installing our POS infrastructure, gathering a listing of equipment, and collecting information on existing service accounts (utilities, internet). Our team will be on-site to support this process."
      },
      {
        question: "When do I have to clear my 'junk' from the property?",
        answer: "All 'junk' must be removed from the property by the day of Closing."
      }
    ]
  },
  {
    title: "Insurance & Assets",
    icon: Shield,
    questions: [
      {
        question: "When should I cancel my business insurance?",
        answer: "Big Brand will have general business liability insurance Day 1 of ownership (1 day after Closing)."
      },
      {
        question: "Are you acquiring my service vehicles?",
        answer: "As part of the acquisition, Big Brand would be acquiring all operating assets of the business. This would include service vehicles. That said, we evaluate on a case-by-case basis whether we would continue to operate the service vehicles. In cases where we decide not to use them, the vehicles are retained by the Seller."
      },
      {
        question: "What should I do with my personal property at the shop?",
        answer: "Personal property that is not core to the operations of the business such as art, décor, small personal tools, etc. can be retained by the Seller. Retained assets must be listed in the Asset Purchase agreement."
      },
      {
        question: "Do you all take on my equipment leases or other leases post-close?",
        answer: "No. It will be the Seller's responsibility to address any liabilities or obligations on the Company prior to or at Closing. Liabilities and obligations include but are not limited to equipment leases, bank loans, accrued employee PTO, accounts payable, etc. All equipment on the premises must be free and clear of any loans, liens, or outstanding payments as we will not assume any such obligations unless specifically agreed upon in writing in advance."
      }
    ]
  },
  {
    title: "Operations",
    icon: DollarSign,
    questions: [
      {
        question: "How much inventory do I need at close?",
        answer: "As described in the APA, it is expected the business will be delivered with an inventory level consistent with historical operating practices. The business should have ~2-3 weeks of inventory so we can continue to serve customers immediately post-close while bringing in our own inventory. If the business normally operates with less inventory on hand, please discuss with the deal lead."
      },
      {
        question: "Will we be using a new POS system?",
        answer: "Yes. Big Brand has a proprietary POS called EDGE. We will install the IT infrastructure after signing the APA and have it ready to go-live immediately after Closing. All employees will be trained on the new POS system which is user-friendly and purpose-built for the tire & automotive industry."
      }
    ]
  }
];

export const FAQModal = ({ isOpen, onClose }: FAQModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSections = faqSections.map(section => ({
    ...section,
    questions: section.questions.filter(
      q => 
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(section => section.questions.length > 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <HelpCircle className="h-6 w-6 text-primary" />
            <span>Frequently Asked Questions</span>
          </DialogTitle>
          <DialogDescription>
            Find answers to common questions about the acquisition process
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* FAQ Content */}
          <div className="overflow-y-auto max-h-[60vh] pr-2">
            {filteredSections.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No FAQs found matching your search.
              </p>
            ) : (
              <Accordion type="multiple" className="space-y-4">
                {filteredSections.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="space-y-2">
                    <div className="flex items-center space-x-2 text-lg font-semibold text-foreground border-b border-border pb-2">
                      <section.icon className="h-5 w-5 text-primary" />
                      <span>{section.title}</span>
                    </div>
                    
                    {section.questions.map((faq, questionIndex) => (
                      <AccordionItem
                        key={`${sectionIndex}-${questionIndex}`}
                        value={`${sectionIndex}-${questionIndex}`}
                        className="border-none"
                      >
                        <AccordionTrigger className="text-left hover:no-underline py-3 px-4 rounded-lg hover:bg-accent">
                          <span className="font-medium text-sm">{faq.question}</span>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {faq.answer}
                          </p>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </div>
                ))}
              </Accordion>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};