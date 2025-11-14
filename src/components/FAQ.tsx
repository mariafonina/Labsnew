import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Search, HelpCircle, ThumbsUp } from "lucide-react";
import { useState, useMemo } from "react";
import { useApp } from "../contexts/AppContext";

export function FAQ() {
  const { faqItems, toggleFAQHelpful, isLiked, toggleLike, auth } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(faqItems.map((item) => item.category)));
    return uniqueCategories;
  }, [faqItems]);

  // Filter FAQ items based on search and category
  const filteredItems = useMemo(() => {
    let items = faqItems;

    // Filter by category
    if (selectedCategory) {
      items = items.filter((item) => item.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.question.toLowerCase().includes(query) ||
          item.answer.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
      );
    }

    return items;
  }, [faqItems, searchQuery, selectedCategory]);

  // Group by category
  const groupedByCategory = useMemo(() => {
    return filteredItems.reduce((acc: any, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});
  }, [filteredItems]);

  const handleLike = (faqId: string) => {
    // Use likes system to track if user liked this FAQ
    if (!isLiked(faqId)) {
      toggleFAQHelpful(faqId);
    }
    toggleLike(faqId);
  };

  // Get gender for accent colors
  const gender = auth.isAuthenticated 
    ? (localStorage.getItem("userGender") as "male" | "female" | null)
    : null;

  const accentColors = gender === "male" 
    ? {
        gradient: "from-lime-100 to-green-100",
        text: "text-lime-600",
        bg: "bg-gradient-to-r from-lime-100 to-green-100",
        hoverBg: "hover:bg-lime-50",
        activeBg: "bg-gradient-to-r from-lime-400 to-green-400",
        activeText: "text-white",
        buttonGradient: "from-lime-400 to-green-400",
        buttonHover: "hover:from-lime-500 hover:to-green-500",
      }
    : {
        gradient: "from-pink-100 to-rose-100",
        text: "text-pink-600",
        bg: "bg-gradient-to-r from-pink-100 to-rose-100",
        hoverBg: "hover:bg-pink-50",
        activeBg: "bg-gradient-to-r from-pink-400 to-rose-400",
        activeText: "text-white",
        buttonGradient: "from-pink-400 to-rose-400",
        buttonHover: "hover:from-pink-500 hover:to-rose-500",
      };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative max-w-2xl mx-auto mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Поиск по вопросам..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-14 text-base shadow-sm"
        />
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          onClick={() => setSelectedCategory(null)}
          className={selectedCategory === null 
            ? `bg-gradient-to-r ${accentColors.buttonGradient} ${accentColors.buttonHover} font-extrabold`
            : ""}
        >
          Все
        </Button>
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            onClick={() => setSelectedCategory(category)}
            className={selectedCategory === category 
              ? `bg-gradient-to-r ${accentColors.buttonGradient} ${accentColors.buttonHover} font-extrabold`
              : ""}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* FAQ Items */}
      {Object.keys(groupedByCategory).length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-500">
            По вашему запросу ничего не найдено. Попробуйте изменить поисковый запрос.
          </p>
        </Card>
      ) : (
        Object.entries(groupedByCategory).map(([category, items]: [string, any]) => (
          <div key={category} className="space-y-4">
            <Accordion type="single" collapsible className="space-y-3">
              {items.map((item: any) => (
                <AccordionItem
                  key={item.id}
                  value={item.id}
                  className="border-0 bg-white/60 backdrop-blur-sm rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <AccordionTrigger className="px-6 py-5 hover:no-underline hover:bg-gray-50/50">
                    <div className="flex items-start justify-between w-full pr-4">
                      <span className="font-bold text-xl text-left">
                        {item.question}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-5">
                    <p className="text-gray-600 leading-relaxed mb-4">
                      {item.answer}
                    </p>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(item.id)}
                        className={`gap-2 ${
                          isLiked(item.id)
                            ? `${accentColors.activeBg} ${accentColors.activeText} hover:opacity-90`
                            : "text-gray-500 hover:bg-gray-100"
                        }`}
                      >
                        <ThumbsUp className={`h-4 w-4 ${isLiked(item.id) ? "fill-current" : ""}`} />
                        <span className="font-semibold">{item.helpful}</span>
                      </Button>
                      <Badge className={`${accentColors.bg} ${accentColors.text} text-sm px-3 py-1`}>
                        {category}
                      </Badge>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))
      )}
    </div>
  );
}