"""
Bayesian-adjusted rating so a handful of troll reviews can't tank a
genuinely good vendor before it has built up a review history.

bayesian_avg = (C * m + sum(ratings)) / (C + n)

  n = number of reviews this listing has
  m = global average rating across all listings (the prior)
  C = confidence constant — how many "virtual average reviews" a brand new
      listing starts with. Higher C = new listings pulled harder toward the
      global average until they accumulate real reviews.
"""

CONFIDENCE_CONSTANT = 10


def bayesian_average(raw_sum: float, n: int, global_mean: float, c: int = CONFIDENCE_CONSTANT) -> float:
    if n == 0:
        return round(global_mean, 2)
    return round((c * global_mean + raw_sum) / (c + n), 2)
