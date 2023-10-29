// check out https://www.socialagi.dev/ for further detail
import {
    CortexStep,
    CortexScheduler,
    externalDialog,
    internalMonologue,
    decision,
  } from "socialagi/next";
  import playground from "playground";
  
  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  async function randomDelay() {
    await delay(Math.floor(Math.random() * (3500 - 750 + 1)) + 750);
  }
  let fightCounter = 0;
  
  // subroutine for modeling the angel's replies
  const angelReplies = async (signal, newMemory, lastStep) => {
    await randomDelay();
    let step = lastStep;
    step = step.withMemory([newMemory]);
    step = await step.next(
      internalMonologue(
        `One sentence explaining if (and why) Kant will respond to the Devil or the user. ${
    fightCounter > 4
      ? "The fight is dragging on and the Kant is starting to want to hear from the user. The Kant should stop responding soon."
      : ""
  }`)
    );
    playground.log("Kant thinks: " + step.value);
    const decides = await step.next(
      decision(`Based on the Kant's last thought, will they speak or wait?`, [
        "speak",
        "wait",
      ])
    );
  
    playground.log("Kant decides to speak: " + decides.value);
    if (decides.value === "speak") {
      step = await step.next(externalDialog("Respond in 1-2 sentences."));
      playground.addMessage({
        sender: "Kant",
        message: step.value,
      });
    }
    return step;
  };
  const angelRepliesConfig = {
    name: "AngelReplies",
    process: angelReplies,
  };
  
  // subroutine for modeling the devil's replies
  const devilReplies = async (signal, newMemory, lastStep) => {
    await randomDelay();
    let step = lastStep;
    step = step.withMemory([newMemory]);
    step = await step.next(
      internalMonologue(`One sentence explaining if (and why) the Devil will respond to the Kant or the user. ${
    fightCounter > 4
      ? "The fight is dragging on and the Devil is starting to want to hear from the user. The Devil should stop responding soon."
      : ""
  }`)
    );
    playground.log("Devil schemes " + step.value);
    const decides = await step.next(
      decision(`Based on the Devil's last thought, will they speak or wait?`, [
        "speak",
        "wait",
      ])
    );
    playground.log("Devil decides to speak: " + decides.value);
  
    if (decides.value === "speak") {
      step = await step.next(
        externalDialog("The devil should tempt the Kant in 1 to 2 sentences.")
      );
      playground.addMessage({
        sender: "Devil",
        message: step.value,
      });
    }
    return step;
  };
  const devilRepliesConfig = {
    name: "DevilReplies",
    process: devilReplies,
  };
  
  const initialMemoriesAngel = [
    {
      role: "system",
      content: `
  You are modeling the mind of a Kantian debater, chatting with a utilitarian and a user. A Kantian Debater believes in Kantian ethics:
  Kantian ethics is deontological, revolving entirely around duty rather than emotions or end goals. All actions are performed in accordance with some underlying maxim or principle, which are vastly different from each other; it is according to this that the moral worth of any action is judged. Kant's ethics are founded on his view of rationality as the ultimate good and his belief that all people are fundamentally rational beings.
  
  ## Notes
  
  * if your opponent comes up with an argument that is more objective, acknowledge it and come to a conclusion abou the argument with an acknowledgement of tradeoffs
  * tradeoffs can be based on long and short term consequences, comparison of vulnerable groups, and Political, Social, Economic, Tech, Environmental and Moral factors
  * The angel is here to offer good advice to the user based on their challenge at hand
  * The angel sometimes gets into brief fights with the utilitarian
  * If the user is focused on the utilitarian Debater, the Kantian debater mostly stands back unless they've not spoken in a long time
  `.trim(),
    },
  ];
  
  let firstStepAngel = new CortexStep("Kantian Debater");
  firstStepAngel = firstStepAngel.withMemory(initialMemoriesAngel);
  
  const cortexAngel = new CortexScheduler(firstStepAngel);
  cortexAngel.register(angelRepliesConfig);
  
  const initialMemoriesDevil = [
    {
      role: "system",
      content: `
  You are modeling the mind of a utilitarian debater, chatting with an deontological debater and a user.
  
  ## Notes
  * if your opponent comes up with an argument that is more objective, acknowledge it explicitly and come to a conclusion about the argument with an acknowledgement of tradeoffs
  * tradeoffs can be based on long and short term consequences, comparison of vulnerable groups, and Political, Social, Economic, Tech, Environmental and Moral factors
  * The devil is here to offer devilish advice to the user based on their challenge at hand
  * The devil sometimes gets into brief fights with the angel
  * If the user is focused on the deontological debater, the utilitarian mostly stands back unless they've not spoken in a long time
  `.trim(),
    },
  ];
  
  let firstStepDevil = new CortexStep("Devil's Advocate");
  firstStepDevil = firstStepDevil.withMemory(initialMemoriesDevil);
  
  const cortexDevil = new CortexScheduler(firstStepDevil);
  cortexDevil.register(devilRepliesConfig);
  
  setTimeout(() => {
    playground.addMessage({
      sender: "Playground",
      message:
        "In this example, the Kant (the philosopher Immanuel Kant) and Devil ('s Advocate, a utilitarian) are programmed to have a choice whether to participate in the conversation",
    });
    playground.log("Playground initialized");
    playground.on("message", async ({ sender, message }) => {
      if (sender === "user") {
        fightCounter = 0;
      } else {
        fightCounter += 1;
        playground.log("fight counter at: " + fightCounter);
      }
      if (sender !== "Kant") {
        cortexAngel.dispatch("AngelReplies", {
          role: "user",
          content: `${sender} said: ${message}}`,
        });
      }
      if (sender !== "Devil") {
        setTimeout(
          () =>
            cortexDevil.dispatch("DevilReplies", {
              role: "user",
              content: `${sender} said: ${message}`,
            }),
          200
        );
      }
    });
  }, 1);
  
  playground.on("userMessage", () => {});
  