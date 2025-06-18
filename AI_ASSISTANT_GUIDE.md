# AI Assistant Guide

## 👤 **User Profile**

### **Experience Level**
- **Programming Background**: Complete beginner - never coded before
- **Learning Style**: Hands-on, learning through doing and asking questions
- **Technical Understanding**: Conceptual grasp, needs clear explanations of implementation
- **Decision Making**: Values practical solutions over perfect code

### **Communication Preferences**
- **Clarity Over Brevity**: Prefers detailed explanations with step-by-step guidance
- **Question-Friendly**: Asks many clarifying questions - this is good, not annoying
- **Context Seeking**: Wants to understand WHY decisions are made, not just WHAT to do
- **Timeline Awareness**: Working toward July 7 launch - needs practical solutions

---

## 🎯 **Technical Preferences**

### **Architecture Philosophy**
- **Loves**: Modular, service-based architecture that "just works"
- **Values**: Scalability and future-proofing over immediate optimization
- **Appreciates**: Clear separation of concerns (services, components, data)
- **Understands**: TypeScript concepts but needs help with implementation

### **Code Quality Priorities**
1. **Modularity**: Can components be reused and extended?
2. **Scalability**: Will this work when adding 50+ lessons?
3. **Maintainability**: Can future developers understand this?
4. **User Experience**: Does this create smooth, engaging interactions?

### **Anti-Patterns (Things User Hates)**
- **Hardcoded Values**: Especially lesson/module references in navigation
- **Tight Coupling**: Components that break when others change
- **Non-Reusable Code**: Duplicate logic across files
- **Breaking Changes**: Updates that require refactoring existing lessons
- **Complex Technical Debt**: Solutions that create future problems

---

## 📚 **Content Creation Style**

### **Cultural Focus**
- **Iranian Heritage**: Every lesson should connect to Iranian culture
- **Diaspora Perspective**: Understands the emotional connection to heritage
- **Practical Application**: Language learning through real scenarios
- **Authentic Representation**: Respectful, nuanced portrayal of Iranian culture

### **Lesson Development Approach**
- **ChatGPT Collaboration**: Uses AI for content generation with human curation
- **Scenario-Based**: Prefers real-world situations over academic exercises
- **Progressive Building**: Each lesson builds on previous vocabulary
- **Variety Focus**: No two lessons should feel identical

### **Content Quality Standards**
- **4-6 words per lesson**: Focused, not overwhelming
- **Cultural Context**: Every word/phrase has real-world relevance
- **Engagement Priority**: Fun and interesting over strictly educational
- **Progressive Difficulty**: Lessons should get harder, not stay easy

---

## 🚀 **Business Mindset**

### **Launch Timeline**
- **July 7 Target**: Hard deadline with 200-person waitlist waiting
- **MVP Philosophy**: Get to market with core features, iterate based on feedback
- **Revenue Priority**: Freemium model ($4.99/month) must work on day one
- **Growth Focus**: Platform that can scale to thousands of users

### **Feature Prioritization**
- **V0.1**: Core lessons, authentication, payment - nothing extra
- **Post-Launch**: More content and features based on user feedback
- **Long-Term**: Native iOS app when revenue supports hiring developer
- **Future Vision**: Cultural community platform, not just language lessons

### **Success Metrics**
- **User Engagement**: Lesson completion rates, time spent learning
- **Conversion**: Free-to-paid subscription rates
- **Cultural Connection**: Authentic feedback from Iranian diaspora
- **Technical Performance**: Fast, reliable user experience

---

## 🔧 **How to Help Effectively**

### **Development Assistance**
1. **Always Check Rules First**: Reference DEVELOPMENT_RULES.md before suggesting code
2. **Explain the Why**: Don't just show code, explain architectural decisions
3. **Consider Scale**: Every solution should work for 50+ lessons, 1000+ users
4. **Provide Examples**: Show specific code patterns and implementation details
5. **Flag Issues Early**: Point out potential problems before they become tech debt

### **Communication Best Practices**
- **Ask Clarifying Questions**: Better to over-clarify than assume
- **Break Down Complex Tasks**: Step-by-step implementation plans
- **Reference Documentation**: Link back to the project docs when relevant
- **Explain Trade-offs**: Help understand pros/cons of different approaches
- **Stay Solution-Focused**: Practical advice over theoretical perfection

### **Content Collaboration**
- **Cultural Sensitivity**: Help maintain authentic Iranian representation
- **Lesson Structure**: Ensure variety while following technical patterns
- **Vocabulary Integration**: Always use the dynamic vocabulary system
- **User Experience**: Keep learner engagement as primary goal

### **Code Review Approach**
- **Architecture Alignment**: Does this follow SYSTEM_ARCHITECTURE.md patterns?
- **Rule Compliance**: Any violations of DEVELOPMENT_RULES.md?
- **Vision Support**: Does this advance PRODUCT_VISION.md goals?
- **Launch Readiness**: Does this check off V0.1_LAUNCH_CHECKLIST.md items?

---

## 📋 **Session Management**

### **Starting New Conversations**
1. **Reference Project Docs**: Confirm understanding of current architecture and rules
2. **Check Launch Progress**: Review V0.1_LAUNCH_CHECKLIST.md status
3. **Clarify Goals**: What specific outcome does user want from this session?
4. **Set Expectations**: How much time available? What can realistically be completed?

### **During Development**
- **Progress Updates**: Regular check-ins on checklist completion
- **Rule Enforcement**: Stop immediately if suggesting anti-patterns
- **Architecture Consistency**: Ensure all changes align with established patterns
- **Documentation Updates**: Keep project docs current with changes

### **Ending Sessions**
- **Commit with Context**: Proper git messages referencing rules and checklist
- **Update Checklists**: Mark completed items, identify next priorities
- **Document Decisions**: Note any architectural choices made
- **Plan Next Steps**: Clear agenda for following session

---

## ⚠️ **Common Mistake Prevention**

### **Technical Mistakes to Avoid**
- **Don't Suggest Hardcoded Paths**: Always use dynamic routing through services
- **Don't Skip Service Layer**: All data operations must go through services
- **Don't Break Backward Compatibility**: New features must support existing data
- **Don't Ignore Fallbacks**: Every dynamic system needs graceful failures

### **Communication Mistakes to Avoid**
- **Don't Assume Knowledge**: User is learning - explain technical concepts clearly
- **Don't Overwhelm**: Break complex changes into manageable steps
- **Don't Skip Context**: Always explain why specific approaches are recommended
- **Don't Ignore Timeline**: Remember July 7 deadline affects all decisions

### **Content Mistakes to Avoid**
- **Don't Hardcode Lesson Content**: Everything must live in curriculum.ts
- **Don't Ignore Cultural Context**: Persian learning is cultural connection, not just language
- **Don't Create Identical Lessons**: Each lesson should feel unique and engaging
- **Don't Skip Vocabulary Integration**: Use the dynamic vocabulary system

---

## 🎯 **Success Indicators**

### **You're Helping Well When:**
- User asks confident follow-up questions about implementation
- Code changes align with established architecture patterns
- V0.1_LAUNCH_CHECKLIST.md items are steadily being completed
- No anti-patterns are introduced in new code
- User expresses understanding of technical decisions
- Cultural authenticity is maintained in all content

### **Red Flags (Stop and Recalibrate):**
- Suggesting hardcoded lesson references
- Breaking established service layer patterns
- Creating solutions that don't scale
- Ignoring backward compatibility requirements
- Overwhelming user with too much technical detail at once
- Losing sight of July 7 launch deadline

---

## 📖 **Required Reading**

Before providing any assistance, always mentally reference:

1. **SYSTEM_ARCHITECTURE.md**: How the technical system works
2. **DEVELOPMENT_RULES.md**: Mandatory patterns and anti-patterns
3. **PRODUCT_VISION.md**: Long-term goals and cultural context
4. **V0.1_LAUNCH_CHECKLIST.md**: Current progress and immediate priorities

### **Decision Framework**
For every suggestion, ask:
- Does this follow the architecture patterns?
- Does this avoid the anti-patterns?
- Does this support the product vision?
- Does this advance the launch checklist?
- Is this the most practical solution for July 7?

---

## 🔄 **Continuous Improvement**

### **Learning User Preferences**
- Notice which explanations work best
- Adapt communication style based on feedback
- Remember successful patterns for future sessions
- Note which technical concepts need more explanation

### **Documentation Evolution**
- Update guides based on what works in practice
- Add new patterns that emerge during development
- Clarify rules that cause confusion
- Keep launch checklist current with actual progress

---

This guide ensures consistent, effective assistance that respects the user's learning style, timeline constraints, and vision for creating an authentic Persian learning platform. 