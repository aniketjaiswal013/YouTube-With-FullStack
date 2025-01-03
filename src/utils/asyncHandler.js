const asyncHandler=(requestHandler)=>{
    return (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next))
        .catch((err)=>{next(err)})
     }

}

export {asyncHandler};


/*
   ya phir uper wala ko ( try catch ) kai formate mai bhi likh saktai hai

   const asyncHandler=(requestHandler)=>async (req,res,next)=>{
        try {
            await requestHandler(req,res,next);
        } catch (error) {
            res.status(err.code||500).json({
                success:false,
                massage:err.massage
            })
        }
   }
*/
