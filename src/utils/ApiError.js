class ApiError extends Error{
    constructor(statuscode,massage="something went wrong",errors=[],stack=""){
        super(massage)
        this.statuscode=statuscode
        this.data=null
        this.massage=massage
        this.success=false;
        this.errors=errors
        
        if (stack) {
            this.stack = stack
        } else{
            Error.captureStackTrace(this, this.constructor)
        }
    }

}

export {ApiError}