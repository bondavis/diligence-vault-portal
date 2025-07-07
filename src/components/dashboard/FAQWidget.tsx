import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HelpCircle, ChevronRight } from 'lucide-react';
import { FAQModal } from './FAQModal';

const quickFAQs = [
  {
    question: "Will my employees still have a job?",
    answer: "Yes. We plan to hire at least 75% of legally eligible employees that fit within our operating model."
  },
  {
    question: "When can I tell my employees about the deal?",
    answer: "Once the Asset Purchase Agreement is signed, Big Brand will partner with you to deliver the message."
  },
  {
    question: "When will the transaction be funded?",
    answer: "The transaction is funded on the day of Closing or the day after depending on when signatures are received."
  },
  {
    question: "When should I cancel my business insurance?",
    answer: "Big Brand will have general business liability insurance Day 1 of ownership (1 day after Closing)."
  }
];

export const FAQWidget = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            <span>Frequently Asked Questions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {quickFAQs.map((faq, index) => (
            <div key={index} className="space-y-2">
              <h4 className="text-sm font-medium text-foreground leading-tight">
                {faq.question}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {faq.answer}
              </p>
              {index < quickFAQs.length - 1 && (
                <div className="border-b border-border mt-3" />
              )}
            </div>
          ))}
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-4 text-primary border-primary hover:bg-primary hover:text-primary-foreground"
            onClick={() => setIsModalOpen(true)}
          >
            View All FAQs
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      <FAQModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};