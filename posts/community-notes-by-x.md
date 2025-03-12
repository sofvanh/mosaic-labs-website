---
title: "Community Notes by X"
date: "2024-03-19"
description: "How X's Community Notes algorithm surfaces fact-checks with cross-partisan support"
---
I did an exploration into how [Community Notes](https://en.wikipedia.org/wiki/Community_Notes) (formerly Birdwatch) from X (formerly Twitter) works, and how its algorithm decides which notes get displayed to the wider community. In this post, I’ll share and explain what I found, as well as offer some comments.   
 

![](https://lh7-us.googleusercontent.com/ubxhCRO58b1v_eBZjrI74Zj25rfPjKWDxTeZ6CpRGf-t6GyJOMqr7vvC1khUYptxGkCd2s2c1_hqw5aZV2ko5o-Se5SMavcOxiNNT3bQm1lM1x3vp6wwZFRsWTgBaXAh939qGSOArrT6Mcy31eYvyak)

Community Notes is a fact-checking tool available to US-based users of X/Twitter which allows readers to attach notes to posts to give them clarifying context. It uses an [open-source](https://github.com/twitter/communitynotes) [bridging-based ranking](https://www.belfercenter.org/publication/bridging-based-ranking) algorithm intended to **promote notes which receive cross-partisan support**, and demote notes with a strong partisan lean. The tool seems to be pretty popular overall, and most of the criticism aimed toward it seems to be about how Community Notes fails to be a [sufficient replacement](https://www.techdirt.com/2023/10/31/community-notes-is-a-useful-tool-for-some-things-but-not-as-a-full-replacement-for-trust-safety/) for other, more top-down moderation systems.[^7v168kvc2y3] 

  
This seems interesting to me as an experiment in social technology that aims to **improve group epistemics**, and understanding how it works seems like a good place to start before trying to design other group epistemics algorithms. 

How does the ranking algorithm work?
====================================

The full algorithm, while open-source, is quite complicated and I don’t fully understand every facet of it, but I’ve done a once-over read of the [original Birdwatch paper](https://github.com/twitter/communitynotes/blob/main/birdwatch_paper_2022_10_27.pdf), gone through the [Community Notes documentation](https://communitynotes.twitter.com/guide/en/under-the-hood/ranking-notes), and read this [summary/commentary](https://vitalik.eth.limo/general/2023/08/16/communitynotes.html) by Vitalik Buterin. Here’s a summary of the “core algorithm” as I understand it (to which much extra logic gets attached):   
 

**Users** are the people who have permission to rate community notes. To get permission, a person needs to have had an account on X for more than 6 months, have a verified phone number, and have committed no violations of X’s rules. The rollout of community notes is slow, however, and so eligible account holders are only added to the Community Notes user pool periodically, and at random. New users don’t immediately get permission to write their own notes, having to first get a “rating impact” by rating existing notes (will explain this later).  
 

**Notes** are short comments written by permitted users on posts they felt needed clarification. These are not immediately made publicly visible on X, first needing to be certified as “helpful” by aggregating ratings by other Community Notes users using their ranking algorithm.   
 

Users are invited to rate notes as either “not helpful,” “somewhat helpful,” or “helpful.” The results of all user-note pairs are recorded in a matrix \\(r\\) where each element \\(r_{un} \in \{0, 0.5, 1, null\}\\) corresponds to how user \\(u\\) rated note \\(n\\). Users only rate a small fraction of notes, so most elements in the matrix are “null.” Non-null elements are called “observed” ratings, and values of 0, 0.5, and 1 correspond to the qualitative ratings of “not helpful,” “somewhat helpful,” and “helpful” respectively.

![](https://lh7-us.googleusercontent.com/U-ngibxRy-fHyn9NZ8NUTsZyo1RiMS8OoBAvWWpHb_3Xk7fULiZnnYfkKVYuidSpsjpamPKKYQgS8nqPZFAiuj0ZXSFxCzqc58MV3Prc91S6GhlJzq3cp5kSXu-q8nvBsGTqv-gzsNyL9PIWjZpcrsQ)

This rating matrix is then used by their algorithm to compute a helpfulness score for each note. It does this is by learning a model of the ratings matrix which explains each observed rating as a sum of four terms: 

\\(\hat{r}_{un} = \mu + i_u + i_n + f_u \cdot f_n\\)

Where:

*   \\(\mu\\): Global intercept (shared across all ratings) 
*   \\(i_u\\): User intercept (shared across all ratings by user u)
*   \\(i_n\\): Note intercept (shared across all ratings of note n) This is the term which will eventually determine a note's "helpfulness."
*   \\(f_u\\), \\(f_n\\): Factor vectors for \\(u\\) and \\(n\\). The dot product of these vectors is intended to describe the “ideological agreement” between a user and a note. These vectors are currently one dimensional (each just a single number), though the algorithm is in principle agnostic to the number of dimensions. 

For U users and N notes that gets us  1 + 2U + 2N free parameters making up this model. These parameters are estimated via gradient descent every hour, minimizing the following squared error loss function (for observed ratings only):

\\(\sum_{r_{un}} (r_{un} - \hat{r}_{un})^2 + \lambda_i (i_u^2 + i_n^2 + \mu^2) + \lambda_f (||f_u||^2 + ||f_n||^2)\\)

The first term is the square difference between the model’s prediction and the actual rating, and the final two terms are regularization terms, where \\(\lambda_i =0.15\\) and \\(\lambda_f=0.03\\). \\(\lambda_i\\) is deliberately set significantly higher than \\(\lambda_f\\) to push the algorithm to rely primarily on the factor vectors to explain the ratings a note receives, keeping the other terms as low as possible. The original Birdwatch paper presents this choice as risk aversion[^rdjw127zfdp]:

> …we particularly value precision (having a low number of false positives) over recall (having a low number of false negatives) due to risks to our community and reputation from increasing visibility of low quality notes.

This algorithm, in the process of fitting all the different factor vectors for notes and users, **automatically identifies an ideological spectrum**. Because of the asymmetric regularization above, it also explains the ratings as much as possible in terms of this ideological spectrum, such that the intercept terms \\(\mu\\), \\(i_u\\), and \\(i_n\\) end up describing how much the rating outcomes *differ* from what was predicted by the ideological part of the model.   
 

Finally, a note’s helpfulness score is determined by the final value reached by \\(i_n\\). **This helpfulness score is highest if the note is ranked as “helpful” by Community Notes users more often than the rest of the model would predict.** If this parameter reaches a threshold of \\(i_n > 0.4\\), then the note is certified as “helpful” and is shown to the wider X community.[^5xykapxkjpu] Likewise, if \\(i_n < -0.04\\), then the note is certified as “not helpful.”[^t1y2rb8jkha]   
 

The following figure illustrates the results from the original Birdwatch paper after applying this algorithm, where the y-axis is \\(i_n\\), and the x-axis is \\(f_n\\):

![](https://lh7-us.googleusercontent.com/mN85i_THz4MQrV2veOv2pTcO6NlinNFaN09FfGejwvAgpMSKsD5np39D4lG4SkxkE3-EMFZbtFb4KUW5A7x4rd0_Vr7I1XgUgAYxIGQ0pl02xrO_tlnalMGpAQhH3QTUMJyTmzinDicCIQWQr7z2CvU)

Some further details and comments
=================================

**Factor vectors**: First thing to note is that, to avoid overfitting, the factor vectors are currently just one dimensional (though they plan to increase the dimensions when they have more data). In practice, across all notes, this results in a spectrum where a negative factor roughly corresponds to the political left, and a positive factor corresponds to the political right (note that this spectrum was not hardcoded, but rather found automatically by the algorithm). This leaves a lot to be desired. In particular, because **“consensus between the left and right” is used as a proxy for high-quality information**, which might be good in some cases, but probably not for many others.[^c2f2dysibw] There are also plans to use multiple ranking models for different groups, though this seems mostly to be about dealing with geographic and linguistic diversity.[^78m4twa2vsl] 

**Modeling uncertainty**: Another detail is that they actually run gradient descent multiple times, including extra extreme ratings from “pseudo-raters” in each run. This forms a distribution of helpfulness scores, and in the spirit of risk-aversion, they use the lower-bound value of \\(i_n\\) to classify a note as “helpful,” and an upper bound value of \\(i_n\\) to classify it as “not helpful.”[^pyyuakpea3l] 

**User helpfulness**: This is the weirdest part in my opinion. They actually estimate the model parameters in two separate rounds. After the first round, the algorithm computes a “user helpfulness” score for each user based on how well their own ratings predicted the final rating assigned by the algorithm. Users which do a poor job of predicting the group decision are labeled as unhelpful, and are filtered out for the second round, which will give the final verdict on all the notes.[^qzwpuog8b0a] I don’t know how strict filtering is in practice, but from [the docs](https://communitynotes.twitter.com/guide/en/under-the-hood/contributor-scores) it seems that at least two thirds of their ratings need to match the group consensus in order to be counted in the second round. This is also the key to “rating impact,” which unlocks the ability to write your own notes, where you get permission only once you have correctly predicted at least 5 note outcomes.

![](https://lh7-us.googleusercontent.com/_AxlQMH2mXkp-crIjpSOhoxiVredN8JfOKfXwzfEqr06DyhwecVgX42AdWMPKxyTwDzQ_Kq0OnHlcMr2Gzd-9s6FmE6ILkJUfUffnKBkWQfo6LmOjqu6bP19I5m5mblqT0qVdS19-GBS38V7YRFvX4M)

This seems to be asking users to do two contradictory things: 1) Rate notes honestly according to their own beliefs and 2) use their ratings to predict what other people believe. There is also a “writer impact” system, where writers need to maintain a positive ratio of “helpful” to “not helpful” notes, or else they are rate-limited. 

**Tag-consensus harassment-abuse note score**: In addition to rating a note as helpful or unhelpful, users are invited to tag a note with something like 20 different predefined descriptors. If there is a cross-partisan consensus (using the same core algorithm described above, but with different labels) that a note is harassment or abuse (this is a single tag), then the algorithm strongly punishes all users who rated this note as helpful by significantly lowering their “user helpfulness” score. The threshold for a note being deemed harassment or abuse is quite high, so I expect that this is fairly rare. I do wonder about how well a coordinated attack could pull off using this mechanism to bully people away from certain topics, and whether there exist any additional mechanisms to prevent this behavior. 

**Tag outlier filtering**: There are roughly ten negative tags. If enough users[^414l34tq4mi] agree on the same negative tag, then the helpfulness threshold for the note rises from 0.4 to 0.5. I’m not sure how easy this is to game, but I could imagine a coordinated attack where could possibly be used to increase this threshold. 

**A note on strategic ratings**: Because of the general risk-averse design, it seems generally hard for individual users to get any one note to be certified as helpful, but pretty easy for motivated users to prevent a note from getting above the helpfulness threshold. However, I have read [an anecdote](https://www.wired.com/story/x-community-notes-disinformation/) by one group of [Ukrainian activists](https://nafo-ofan.org/) who coordinate to get specific notes labeled helpful, also claiming that Russian opponents use similar coordination tactics to get community notes taken down. This might also be because most posts don’t have any notes, and so it could be pretty easy for a small group to form a consensus (notes need at least 5 ratings to be eligible for “helpful” status). The Community Notes algorithm and all of the Community Notes data is open source, so this should make it fairly easy to notice these kinds of coordinated actions if they become widespread (though unclear if there is any system to act in response to manipulation). 

**A comment on jokes as misinformation**: One concern I have is that a lot of X content isn’t making specific claims that can really be fact-checked. Take this example:

![](https://lh7-us.googleusercontent.com/y89V3NMi8Oa7KpgkpwWGW7GQKKJFYa2OUsWUlR4BmEeDbQOpZbfaLj8Jk0ImSW5nIko5qZUBj53EsZXYrDI79qor2Jv9hrb2YC05lTlpcUgaKnJB9dCR0EfDjj-iBRtRYCmzxy2xpp1x-W7XyLCCAtU)

While it seems like a win against misinformation, Musk still gets to hide behind the shield of “joke meme,” further implying that while the actual empirical claims made by the meme are false, the underlying message is still true. Correcting jokes doesn’t seem to be in the scope of Community Notes, and furthermore, political humor often carries a deeper message that is practically impossible to fact-check (and it would be a bit much to require every political meme to be tied to a falsifiable claim).[^d4h8bwlnhq]

Academic commentary
===================

I found two major peer-reviewed papers commenting on Community Notes/Birdwatch:

"[Birds of a Feather Don’t Fact-Check Each Other](https://dl.acm.org/doi/abs/10.1145/3491102.3502040)"[^lsfywmzlr1f] by Jennifer Allen, Cameron Martel, and David Rand

This paper analyzes Birdwatch data from 2021 and seems to primarily find that most users of the platform are extremely partisan when giving ratings, and imply they are likely more partisan than the average X/Twitter user (also being more active, with an average post count >22,000).[^coaqlqpt06h] They also find that, while all users were most likely to submit notes for content that aligned with their partisanship, right-wing users were much more likely to submit notes for left-wing posts/tweets than the reverse, raising concerns that attempts to reward users for agreeing with the consensus might favor left-wing users. Finally they also raise concerns that “partisan dunking” might lead people on the platform to become more partisan rather than less (citing a [study](https://dl.acm.org/doi/pdf/10.1145/3411764.3445642) that empirically tests this).  
 

[Community-Based Fact-Checking on Twitter’s Birdwatch Platform](https://ojs.aaai.org/index.php/ICWSM/article/view/19335) by Nicolas Pröllochs

Similarly, the author analyzes a bunch of Birdwatch data from 2021. They find that the more socially influential a poster is (gauged by the number of followers), the less likely notes on that post are certified “helpful,” as raters tend to become much more divided. They also found, unsurprisingly, that notes which cited sources were more likely to be rated as helpful. Users of Birdwatch were prompted with a checklist of reasons whenever they labeled a note as helpful or unhelpful, and the paper analyzes this data (though doesn’t find anything particularly surprising). They also give a top ten Twitter users ranked by the fraction of tweets with a note tagging their tweet as “misleading,” and find that they are nearly all American politicians, confirming the idea that most Birdwatch users are using the platform to fact-check political content. 

Conclusion
==========

I probably left a lot out, but hopefully that’s a useful overview (if I made any mistakes, please let me know!). Personally, I was most disappointed during this exploration to learn that Community Notes functions primarily to bridge a binary left-right divide, and I would really love to see a version of this algorithm which was less binary, and more politics agnostic. Furthermore, I was also a bit overwhelmed by the complexity of this algorithm, and I share the sentiment brought up in the Vitalik Buterin commentary that it would be nice to see a version of this algorithm which was mathematically cleaner. I also feel like the mixture of rating and prediction into the same action seems murky, and it might be better for users to rate and predict separately.

[^7v168kvc2y3]:  Particularly in the context of Elon Musk (Owner of X/Twitter) firing most of the existing content moderators. 

[^rdjw127zfdp]:  This philosophy of risk aversion appears frequently in many of their design decisions. 

[^5xykapxkjpu]:  To be considered helpful, a note also needs to have a factor vector \(abs(f_n) < 0.5\) (as a final check against polarization).  

[^t1y2rb8jkha]:  Full disclosure, sometimes they use a threshold of -0.04 and sometimes a threshold of \(-0.05 - 0.8*abs(f_n)\), and I don’t totally understand when or why. 

[^c2f2dysibw]:  Though I suppose plausibly the worst disinformation on X at the moment might be mostly political claims. 

[^78m4twa2vsl]:  I originally thought this incentivizes people to strategically rate comments in a way that makes them appear more neutral, but it seems a bit unclear. If a user has a strong partisan lean, they actually maximize the weight of those ratings which are opposite of what their ideology would predict, which makes the incentive landscape a bit more complicated.  

[^pyyuakpea3l]: While the docs explicitly mention using the upper bound for certifying "not helpful" notes, I only saw mention of using the lower bound for certifying "helpful" from the Buterin summary. I think this is probably correct, but I'm not totally sure. 

[^qzwpuog8b0a]:  They do add a safeguard to prevent users from directly copying the group decision by only counting ratings which happened before the group rating is published (48 hours after a note is submitted). 

[^414l34tq4mi]:  Users are weighted by a complicated function which punishes strong ideological disagreement with the note.  

[^d4h8bwlnhq]:  While memes do convey important information not easily shared via specific and concrete claims, it does make discussing their “accuracy” really messy and hard to do (e.g. from the LW community: this commentary on a Shoggoth meme by @TurnTrout ). 

[^lsfywmzlr1f]:  Academics clearly can never resist a pun, even if it’s a pun on another pun.  

[^coaqlqpt06h]:  They also speculate that partisanship might be a key motivator for becoming a Birdwatch contributor.