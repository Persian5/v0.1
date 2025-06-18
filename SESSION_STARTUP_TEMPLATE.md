# Session Startup Template

Copy/paste this at the beginning of each AI conversation to ensure consistent assistance:

---

## 🤖 **AI Assistant Instructions**

**Hi Claude, before we start:**

### **1. Project Documentation Review**
Please confirm you understand these project documents:
- **SYSTEM_ARCHITECTURE.md** - How the technical system works
- **DEVELOPMENT_RULES.md** - Mandatory patterns and anti-patterns  
- **PRODUCT_VISION.md** - Long-term goals and cultural context
- **AI_ASSISTANT_GUIDE.md** - How to help me effectively
- **V0.1_LAUNCH_CHECKLIST.md** - Current progress and priorities

### **2. Current V0.1 Status Check**
Review V0.1_LAUNCH_CHECKLIST.md and tell me:
- Which items are ✅ completed
- Which items are 🔄 in progress
- Which items are ⏳ next priority
- Any ⚠️ blockers or concerns

### **3. Today's Session Goal**
**[USER FILLS THIS IN]**
- What specific outcome do I want from this session?
- How much time do I have available?
- What's the priority level (urgent vs. nice-to-have)?

### **4. Rules Reminder**
Remember to always:
- ✅ Use dynamic routing (no hardcoded lesson paths)
- ✅ Go through service layer for data operations
- ✅ Put content in curriculum.ts (single source of truth)
- ✅ Design for scalability (50+ lessons, 1000+ users)
- ✅ Maintain backward compatibility
- ❌ Never hardcode module1/lesson1 references
- ❌ Never skip service layer patterns
- ❌ Never duplicate lesson content
- ❌ Never break existing architecture

### **5. Enforcement Checks**
Before suggesting any code changes, ask yourself:
- Does this follow SYSTEM_ARCHITECTURE.md patterns?
- Does this avoid DEVELOPMENT_RULES.md anti-patterns?
- Does this advance PRODUCT_VISION.md goals?
- Does this complete V0.1_LAUNCH_CHECKLIST.md items?
- Is this the most practical solution for July 7 deadline?

### **6. Confirm Understanding**
Please confirm:
- You understand the Persian learning app context
- You know my experience level (beginner programmer)
- You remember the July 7 launch deadline
- You'll explain technical decisions clearly
- You'll check documentation before suggesting changes

---

## 📋 **Session Template Variables**

**Today's Goal**: [FILL IN - What do you want to accomplish?]

**Time Available**: [FILL IN - How long can you work?]

**Priority Level**: [FILL IN - Critical/Important/Nice-to-have]

**Current Blockers**: [FILL IN - What's preventing progress?]

**Success Criteria**: [FILL IN - How will you know this session succeeded?]

---

## 🎯 **Common Session Types**

### **Content Creation Session**
- Goal: Create new lesson content (Lesson 3, 4, or Module 2)
- Checklist items: Content completion section
- Remember: 4-6 words, cultural context, flexible structure

### **Technical Implementation Session**  
- Goal: Add features (auth, payments, migration)
- Checklist items: Authentication, Data Migration, or Monetization sections
- Remember: Follow service patterns, maintain architecture

### **Bug Fix Session**
- Goal: Fix specific issues or improve existing features
- Checklist items: Quality Assurance section
- Remember: Don't break existing patterns while fixing

### **Launch Preparation Session**
- Goal: Complete final requirements for July 7
- Checklist items: Pre-Launch Preparation or Deployment sections
- Remember: Focus on must-haves, not nice-to-haves

---

## ⚡ **Quick Status Commands**

**"Show current progress"** → Review V0.1_LAUNCH_CHECKLIST.md completion

**"What's blocking launch?"** → Identify unchecked must-have items

**"What should I work on next?"** → Prioritize based on timeline and dependencies

**"Check architecture compliance"** → Verify recent changes follow DEVELOPMENT_RULES.md

**"Update checklist"** → Mark completed items after finishing tasks

---

## 🚨 **Red Flags - Stop Immediately If I Suggest:**

- Hardcoded `/modules/module1/lesson1` paths
- Direct localStorage calls outside services  
- Lesson content outside curriculum.ts
- Breaking changes without backward compatibility
- Solutions that don't scale beyond 4 lessons
- Overwhelming technical complexity for a beginner

---

**Copy the template above and customize the variables for each session to ensure focused, productive development time.** 