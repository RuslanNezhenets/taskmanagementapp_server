function x = processing(x, w, t, const)
    i = 1;
    count = 0;
    while count < length(x)
        isChange = false;
        newIndices = x;
        while true
            newIndices(i) = newIndices(i) - 1;
            if newIndices(i) >= t(i)
                if all(const([newIndices, w]) <= 0)
                    x(i) = newIndices(i);
                    isChange = true;
                end
            else
                if ~isChange
                    count = count + 1;
                else
                    count = 0;
                end
                break;
            end
        end
    
        if i == length(x)
            i = 1;
        else
            i = i + 1;
        end
    end
end

