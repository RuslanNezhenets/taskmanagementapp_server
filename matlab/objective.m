function result = objective(x, w, coef)   
    result = (sum(x) + max(x)^2) + coef * sum(w);
end